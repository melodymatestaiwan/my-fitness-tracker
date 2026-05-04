import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Ruler, RotateCcw, Check, ChevronRight } from 'lucide-react';
import { GlassCard } from '../components';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const MEASUREMENT_POINTS = [
  { id: 'shoulder', name: '肩寬', unit: 'cm', emoji: '↔️' },
  { id: 'chest', name: '胸圍(估)', unit: 'cm', emoji: '📏' },
  { id: 'waist', name: '腰圍(估)', unit: 'cm', emoji: '📏' },
  { id: 'hip', name: '臀圍(估)', unit: 'cm', emoji: '📏' },
  { id: 'armLength', name: '手臂長', unit: 'cm', emoji: '💪' },
  { id: 'thighLength', name: '大腿長', unit: 'cm', emoji: '🦵' },
  { id: 'torso', name: '軀幹長', unit: 'cm', emoji: '📐' },
];

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2);
}

function calcMeasurements(landmarks, heightCm, imageWidth, imageHeight) {
  if (!landmarks || landmarks.length < 33) return null;

  const lm = landmarks;
  // MediaPipe Pose landmarks indices
  const NOSE = 0, L_SHOULDER = 11, R_SHOULDER = 12, L_ELBOW = 13, R_ELBOW = 14,
        L_WRIST = 15, R_WRIST = 16, L_HIP = 23, R_HIP = 24,
        L_KNEE = 25, R_KNEE = 26, L_ANKLE = 27, R_ANKLE = 28;

  // 計算像素空間中的身高（頭頂到腳踝）
  const headY = lm[NOSE].y - 0.1; // 估計頭頂（鼻子上方約 10%）
  const feetY = Math.max(lm[L_ANKLE].y, lm[R_ANKLE].y);
  const pixelHeight = (feetY - headY) * imageHeight;

  if (pixelHeight <= 0) return null;
  const scale = heightCm / pixelHeight; // cm per pixel

  // 線性測量（直接距離）
  const shoulderPx = Math.abs(lm[L_SHOULDER].x - lm[R_SHOULDER].x) * imageWidth;
  const shoulder = shoulderPx * scale;

  const armLengthPx = (
    dist({ x: lm[L_SHOULDER].x * imageWidth, y: lm[L_SHOULDER].y * imageHeight },
         { x: lm[L_ELBOW].x * imageWidth, y: lm[L_ELBOW].y * imageHeight }) +
    dist({ x: lm[L_ELBOW].x * imageWidth, y: lm[L_ELBOW].y * imageHeight },
         { x: lm[L_WRIST].x * imageWidth, y: lm[L_WRIST].y * imageHeight })
  );
  const armLength = armLengthPx * scale;

  const hipMidY = (lm[L_HIP].y + lm[R_HIP].y) / 2;
  const shoulderMidY = (lm[L_SHOULDER].y + lm[R_SHOULDER].y) / 2;
  const torsoPx = (hipMidY - shoulderMidY) * imageHeight;
  const torso = torsoPx * scale;

  const kneeMidY = (lm[L_KNEE].y + lm[R_KNEE].y) / 2;
  const thighPx = (kneeMidY - hipMidY) * imageHeight;
  const thighLength = thighPx * scale;

  // 圍度估算（使用寬度 × π 的簡化橢圓模型）
  // 假設深度 ≈ 寬度 × 0.65（平均體型）
  const DEPTH_RATIO = 0.65;
  const ellipseCircumference = (w) => {
    const a = w / 2;
    const b = a * DEPTH_RATIO;
    return Math.PI * Math.sqrt(2 * (a * a + b * b));
  };

  // 胸圍：肩膀位置的軀幹寬度
  const chestY = shoulderMidY + (hipMidY - shoulderMidY) * 0.2;
  // 近似胸部寬度 = 肩寬 × 0.85
  const chestWidthPx = shoulderPx * 0.85;
  const chest = ellipseCircumference(chestWidthPx * scale);

  // 腰圍：肩臀中點
  const waistWidthPx = shoulderPx * 0.7;
  const waist = ellipseCircumference(waistWidthPx * scale);

  // 臀圍：臀部寬度
  const hipWidthPx = Math.abs(lm[L_HIP].x - lm[R_HIP].x) * imageWidth * 1.3; // 髖關節比實際臀部窄
  const hip = ellipseCircumference(hipWidthPx * scale);

  return {
    shoulder: Math.round(shoulder * 10) / 10,
    chest: Math.round(chest * 10) / 10,
    waist: Math.round(waist * 10) / 10,
    hip: Math.round(hip * 10) / 10,
    armLength: Math.round(armLength * 10) / 10,
    thighLength: Math.round(thighLength * 10) / 10,
    torso: Math.round(torso * 10) / 10,
  };
}

export default function BodyMeasure({ userProfile, onSave }) {
  const [phase, setPhase] = useState('intro'); // intro | capture | processing | results
  const [photo, setPhoto] = useState(null);
  const [measurements, setMeasurements] = useState(null);
  const [error, setError] = useState('');
  const [landmarker, setLandmarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const userHeight = userProfile?.height || 175;

  // 初始化 MediaPipe
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
        });
        if (!cancelled) setLandmarker(poseLandmarker);
      } catch (e) {
        console.error('MediaPipe init failed:', e);
        if (!cancelled) setError('AI 模型載入失敗，請重新整理頁面');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setError('圖片太大'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target.result);
      setPhase('processing');
      setError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 處理照片
  useEffect(() => {
    if (phase !== 'processing' || !photo || !landmarker) return;
    setLoading(true);

    const img = new Image();
    img.onload = () => {
      try {
        const result = landmarker.detect(img);
        if (!result.landmarks || result.landmarks.length === 0) {
          setError('偵測不到人體，請確保全身入鏡並站直');
          setPhase('capture');
          setLoading(false);
          return;
        }

        const lm = result.landmarks[0];
        const m = calcMeasurements(lm, userHeight, img.width, img.height);
        if (!m) {
          setError('測量計算失敗，請重新拍攝');
          setPhase('capture');
          setLoading(false);
          return;
        }

        setMeasurements(m);
        setPhase('results');

        // 在 canvas 上畫骨架
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          ctx.strokeStyle = '#FF5733';
          ctx.lineWidth = 3;
          ctx.fillStyle = '#FF5733';

          const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
          ];
          connections.forEach(([a, b]) => {
            ctx.beginPath();
            ctx.moveTo(lm[a].x * img.width, lm[a].y * img.height);
            ctx.lineTo(lm[b].x * img.width, lm[b].y * img.height);
            ctx.stroke();
          });
          lm.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x * img.width, p.y * img.height, 5, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
      } catch (e) {
        setError('處理失敗: ' + e.message);
        setPhase('capture');
      }
      setLoading(false);
    };
    img.src = photo;
  }, [phase, photo, landmarker, userHeight]);

  const saveMeasurements = () => {
    if (onSave && measurements) {
      onSave({ ...measurements, date: new Date().toISOString(), photo });
    }
  };

  const reset = () => {
    setPhase('capture');
    setPhoto(null);
    setMeasurements(null);
    setError('');
  };

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center">
          <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-2">AI Body Scanner</p>
          <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none uppercase">Body<br/><span className="text-[#FF5733]">Scan</span></h1>
        </div>

        <GlassCard className="text-center py-8">
          <Ruler className="text-[#FF5733] mx-auto mb-4" size={48} />
          <h3 className="text-white font-black text-lg italic mb-2">AI 身體測量</h3>
          <p className="text-white/30 text-xs leading-relaxed mb-6 px-4">
            使用 AI 姿勢辨識技術，從一張全身照估算你的身體維度。<br/>
            適合追蹤身材變化趨勢。
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2">拍攝要求</p>
            {[
              '穿著貼身衣物（非寬鬆外套）',
              '全身入鏡，頭頂到腳底',
              'A-Pose 站姿：雙手微張、雙腳與肩同寬',
              '背景簡潔、光線充足',
            ].map((t, i) => (
              <p key={i} className="text-white/40 text-xs flex items-center gap-2">
                <span className="text-[#FF5733]">•</span> {t}
              </p>
            ))}
          </div>
          <p className="text-white/20 text-[10px] mb-4">你的身高 {userHeight} cm 將用於校準測量</p>
          <button onClick={() => setPhase('capture')} className="w-full bg-[#FF5733] text-white font-black py-4 rounded-[2rem] shadow-xl uppercase italic tracking-widest active:scale-95 transition-all">
            開始測量
          </button>
        </GlassCard>
      </div>
    );
  }

  // --- Capture ---
  if (phase === 'capture') {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white italic uppercase">上傳照片</h2>
          <p className="text-white/30 text-xs mt-2">請上傳一張符合要求的全身正面照</p>
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />

        <GlassCard className="text-center py-12">
          <div className="w-32 h-48 mx-auto border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center mb-6 relative">
            <span className="text-4xl opacity-30">🧍</span>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-[#FF5733] rounded-full" />
            <div className="absolute -bottom-1 left-4 w-1 h-1 bg-[#FF5733] rounded-full" />
            <div className="absolute -bottom-1 right-4 w-1 h-1 bg-[#FF5733] rounded-full" />
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="bg-[#FF5733] text-white font-black py-4 px-8 rounded-[2rem] shadow-xl uppercase italic active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto">
            <Camera size={20} /> 選擇照片
          </button>
        </GlassCard>

        {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}
      </div>
    );
  }

  // --- Processing ---
  if (phase === 'processing') {
    return (
      <div className="space-y-8 animate-fade-in flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-16 h-16 border-4 border-[#FF5733]/30 border-t-[#FF5733] rounded-full animate-spin" />
        <p className="text-white/40 font-black tracking-widest text-xs uppercase">AI 正在分析你的身體...</p>
      </div>
    );
  }

  // --- Results ---
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-black text-white italic uppercase">測量結果</h2>
        <p className="text-white/30 text-xs mt-2">基於 AI 姿勢辨識 + 身高校準</p>
      </div>

      {/* Skeleton overlay */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-80 flex justify-center bg-black">
        <canvas ref={canvasRef} className="max-h-80 object-contain" />
      </div>

      {/* Measurements */}
      <GlassCard>
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Ruler size={14} /> 測量數據
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENT_POINTS.map(mp => {
            const val = measurements?.[mp.id];
            if (!val) return null;
            return (
              <div key={mp.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-white/30 font-black uppercase">{mp.emoji} {mp.name}</p>
                <p className="text-xl font-black text-white italic">{val}<span className="text-[10px] opacity-40 ml-0.5">{mp.unit}</span></p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-white/20 text-center mt-3">圍度為估算值（±5cm），適合追蹤變化趨勢</p>
      </GlassCard>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={reset} className="flex-1 py-4 rounded-[2rem] font-black text-sm text-white/40 border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
          <RotateCcw size={16} /> 重新拍攝
        </button>
        <button onClick={saveMeasurements} className="flex-1 bg-[#FF5733] text-white font-black py-4 rounded-[2rem] shadow-xl uppercase italic active:scale-95 transition-all flex items-center justify-center gap-2">
          <Check size={16} /> 儲存結果
        </button>
      </div>
    </div>
  );
}
