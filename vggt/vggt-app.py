# modal 사용법은 gemini한테, vggt 사용법은 github에 있는 vggt 코드 열심히 봐서 짰습니다. 
# 그냥 딸깍 하려고 했는데 gemini가 vggt 어떻게 쓰는지 모르더라구요.. 다들 조심하세요 덕분에 삽질만 몇시간 했습니다.
# 쉬우니까 다들 한 번 씩 읽어보고 써보세요 https://github.com/facebookresearch/vggt

import modal
import os

app = modal.App("vggt-app")

def download_model_to_build():
    from huggingface_hub import snapshot_download
    snapshot_download("facebook/VGGT-1B")

vggt_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git")

    # vggt의 requirements.txt나 pyproject.toml 보면 이런거 깔라고 적혀 있습니다. fastapi[standard]는 modal에서 필요한 겁니다.
    .pip_install(
        "fastapi[standard]", 
        "torch==2.3.1", 
        "torchvision", 
        "huggingface_hub", 
        "einops", 
        "safetensors", 
        "opencv-python-headless", 
        "numpy<2", 
        "pillow", 
        "trimesh", 
        "scipy"
    )
    .run_commands(
        "git clone https://github.com/facebookresearch/vggt.git /root/vggt_repo",
        "cd /root/vggt_repo && pip install ." 
    )
    .run_function(
        download_model_to_build
    )
)

@app.cls(image=vggt_image, gpu="A10G", timeout=600, retries=0)
class VGGTInference:
    @modal.enter()
    def load_model(self):
        import torch
        from vggt.models.vggt import VGGT
        
        print("모델 로드 중")
        self.model = VGGT.from_pretrained("facebook/VGGT-1B", local_files_only=True).to("cuda")
        self.model.eval()
        print("모델 준비 완료")

    @modal.method()
    def process_frames(self, image_list_bytes):
        import torch
        import trimesh
        import io
        from PIL import Image
        import torchvision.transforms.functional as TF

        print(f"{len(image_list_bytes)}장 이미지 전처리 시작")
        
        # 아래 이미지 전처리는 https://github.com/facebookresearch/vggt/blob/main/vggt/utils/load_fn.py 에 있는 load_and_preprocess_images 함수를 보고 따라했습니다. 
        # vggt에서 함수는 잘 만들어 놨는데, 저장된 이미지의 경로를 통해서 이미지를 읽는 함수라 modal 서버에는 맞지 않아서 이미지 읽기 빼고는 거의 복붙 수준으로 적었습니다.
        images = []
        TARGET_SIZE = 518
        
        for img_bytes in image_list_bytes:
            img = Image.open(io.BytesIO(img_bytes))

            if img.mode == "RGBA":
                background = Image.new("RGBA", img.size, (255, 255, 255, 255))
                img = Image.alpha_composite(background, img)
            img = img.convert("RGB")

            width, height = img.size

            new_width = TARGET_SIZE
            new_height = round(height * (new_width / width) / 14) * 14
            
            img = img.resize((new_width, new_height), Image.Resampling.BICUBIC)
            tensor_img = TF.to_tensor(img)

            if new_height > TARGET_SIZE:
                start_y = (new_height - TARGET_SIZE) // 2
                tensor_img = tensor_img[:, start_y : start_y + TARGET_SIZE, :]
            
            images.append(tensor_img)

        input_tensor = torch.stack(images).to("cuda")
        
        if input_tensor.dim() == 3:
            input_tensor = input_tensor.unsqueeze(0)
        print("전처리 완료")

        
        print("3D 변환 시작")
        with torch.no_grad():
            with torch.cuda.amp.autocast(dtype=torch.float16):
                predictions = self.model(input_tensor)

        
        pts_tensor = predictions['world_points']
        
        rgb_tensor = predictions['images']
        rgb_tensor = rgb_tensor.permute(0, 1, 3, 4, 2)

        all_points = pts_tensor.reshape(-1, 3).cpu().float().numpy()
        all_colors = rgb_tensor.reshape(-1, 3).cpu().float().numpy()
        
        pcd = trimesh.PointCloud(vertices=all_points, colors=all_colors)
        glb_data = pcd.export(file_type='glb')
        print("변환 종료")
        
        return glb_data


from fastapi import Response, Request
@app.function(image=vggt_image, secrets=[modal.Secret.from_name("vggt-app-secret")])
@modal.fastapi_endpoint(method="POST")
def web_inference(data: dict, request: Request):
    import os

    auth_header = request.headers.get("Authorization")
    my_secret_key = os.environ["VGGT_APP_SECRET"]
    
    if auth_header != f"Bearer {my_secret_key}":
        print(f"이상한 놈이 접근함: {auth_header}")
        return Response(content="누구세요?", status_code=401)

    import base64
    try:
        b64_list = data["images"] 
        image_bytes_list = [base64.b64decode(img) for img in b64_list]
        runner = VGGTInference()
        glb_bytes = runner.process_frames.remote(image_bytes_list)
        print("glb도 다 했다. 여기서 빠르면 파일 크기나 뭐 딴거 문제겠지 뭐")
        return Response(
            content=glb_bytes, 
            media_type="model/gltf-binary",
            headers={"Content-Disposition": "attachment; filename=output.glb"}
        )
    except Exception as e:
        return Response(content=str(e), status_code=500)