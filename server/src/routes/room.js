import { Router } from "express";
const router = Router();
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import axios from 'axios';

import ExpressError from '../utils/ExpressError.js';
import randomId from '../utils/randomId.js';

import Room from '../models/Room.js'
import Image from '../models/Image.js'
import Glb from '../models/Glb.js'


router.get('/', async (req, res) => {
    const rooms = await Room.find().sort({ createdAt: -1 }).populate('images', 'name');

    res.json({ success: true, rooms: rooms });
})

router.get('/:urlid', async (req, res) => {
    const urlid = req.params.urlid;
    
    const room = await Room.findOne({ urlid: urlid }).populate('images', 'name').populate('glb', 'name');
    if (!room) throw new ExpressError('그런 방 없다', 404);

    res.json({ success: true, room: room });
})


const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, callback) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new ExpressError(400, '이미지 파일(jpg, jpeg, png, gif, webp)만 업로드 가능합니다.'));
        }
    }
})


router.post('/', upload.array('images'), async (req, res) => {
    console.log('이미지 받기 완료')
    const { name, description } = req.body;

    const base64Images = req.files.map(file => file.buffer.toString('base64'));
    
    console.log('3D로 변환 중')
    const startTime = Date.now();
    const resFromModal = await axios.post(process.env.VGGT_APP_URL, {
        images: base64Images
    }, {
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${process.env.VGGT_APP_SECRET}`
        }, 
        responseType: 'arraybuffer'
    });
    console.log(`3D 변환 완료, 걸린 시간: ${(Date.now() - startTime) / 1000}`)

    console.log('glb 파일 저장 중')
    const glbName = randomId();
    const glbSavePath = path.join(__dirname, '../../glbs', `${glbName}.glb`);
    await fs.promises.writeFile(glbSavePath, resFromModal.data);
    const glb = await Glb.insertOne({ name: glbName });
    console.log('glb 파일 저장 완료')

    console.log('이미지 파일 저장 중')
    const imagesName = Array.from({ length: req.files.length }, () => randomId());
    await Promise.all(req.files.map((file, idx) => {
        const imageSavePath = path.join(__dirname, '../../images', `${imagesName[idx]}${path.extname(file.originalname)}`);
        return fs.promises.writeFile(imageSavePath, file.buffer);
    })) 
    const images = await Image.insertMany(req.files.map((file, idx) => {
        const imageName = imagesName[idx];
        return { name: imageName }
    }))
    console.log('이미지 파일 저장 완료')

    const room = new Room({
        name: name,
        urlid: randomId(),
        description: description,
        images: images,
        glb: glb
    })
    await room.save();
    
    res.json({ success: true, room: room });
})



export default router;