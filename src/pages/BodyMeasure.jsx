import React, { useState, useRef, useEffect } from 'react';
import { Camera, Ruler, RotateCcw, Check, AlertTriangle } from 'lucide-react';
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
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function calcMeasurements(landmarks, heightCm, w, h) {
  if (!landmarks || landmarks.length < 33) return null;
  const lm = landmarks;
  const L_SHOULDER = 11, R_SHOULDER = 12, L_ELBOW = 13, L_WRIST = 15,
        L_HIP = 23, R_HIP = 24, L_KNEE = 25, R_KNEE = 26, L_ANKLE = 27, R_ANKLE = 28, NOSE = 0;

  // 嚴格驗證：關鍵點可見度必須足夠
  const critical = [L_SHOULDER, R_SHOULDER, L_HIP, R_HIP, L_KNEE, R_KNEE, L_ANKLE, R_ANKLE];
  const lowVis = critical.filter(i => (lm[i].visibility || 0) < 0.4);
  if (lowVis.length > 2) return null;

  // 身體各段順序必須正確
  const shoulderMidY = (lm[L_SHOULDER].y + lm[R_SHOULDER].y) / 2;
  const hipMidYCheck = (lm[L_HIP].y + lm[R_HIP].y) / 2;
  if (!(lm[NOSE].y < shoulderMidY && shoulderMidY < hipMidYCheck)) return null;

  const headY = lm[NOSE].y - 0.1;
  const feetY = Math.max(lm[L_ANKLE].y, lm[R_ANKLE].y);

  // 全身比例檢查
  const bodySpan = feetY - headY;
  if (bodySpan < 0.4) return null;

  const pxH = (feetY - headY) * h;
  if (pxH <= 0) return null;
  const scale = heightCm / pxH;

  const shoulderPx = Math.abs(lm[L_SHOULDER].x - lm[R_SHOULDER].x) * w;
  const shoulder = shoulderPx * scale;

  const armPx = dist(
    { x: lm[L_SHOULDER].x * w, y: lm[L_SHOULDER].y * h },
    { x: lm[L_ELBOW].x * w, y: lm[L_ELBOW].y * h }
  ) + dist(
    { x: lm[L_ELBOW].x * w, y: lm[L_ELBOW].y * h },
    { x: lm[L_WRIST].x * w, y: lm[L_WRIST].y * h }
  );

  const hipMidY = (lm[L_HIP].y + lm[R_HIP].y) / 2;
  const kneeMidY = (lm[L_KNEE].y + lm[R_KNEE].y) / 2;

  const DR = 0.65;
  const ellipse = (pw) => { const a = pw / 2, b = a * DR; return Math.PI * Math.sqrt(2 * (a * a + b * b)); };

  return {
    shoulder: Math.round(shoulder * 10) / 10,
    chest: Math.round(ellipse(shoulderPx * 0.85 * scale) * 10) / 10,
    waist: Math.round(ellipse(shoulderPx * 0.7 * scale) * 10) / 10,
    hip: Math.round(ellipse(Math.abs(lm[L_HIP].x - lm[R_HIP].x) * w * 1.3 * scale) * 10) / 10,
    armLength: Math.round(armPx * scale * 10) / 10,
    thighLength: Math.round((kneeMidY - hipMidY) * h * scale * 10) / 10,
    torso: Math.round((hipMidY - shoulderMidY) * h * scale * 10) / 10,
  };
}

// 檢查姿勢是否符合標準（嚴格版）
function checkPose(landmarks, vw, vh) {
  if (!landmarks || landmarks.length < 33) return { ok: false, msg: '偵測不到人體' };
  const lm = landmarks;
  const checks = [];

  // 關鍵關節點的可見度必須夠高（MediaPipe 給每個點 visibility 分數 0-1）
  const criticalPoints = [11, 12, 23, 24, 25, 26, 27, 28]; // 雙肩、雙臀、雙膝、雙踝
  const lowVisibility = criticalPoints.filter(i => (lm[i].visibility || 0) < 0.5);
  if (lowVisibility.length > 2) return { ok: false, msg: '請拍攝全身照（需看到肩膀到腳踝）' };

  // 全身入鏡：頭在上方，腳在下方
  const headY = lm[0].y;
  const feetY = Math.max(lm[27].y, lm[28].y);
  const shoulderY = (lm[11].y + lm[12].y) / 2;
  const hipY = (lm[23].y + lm[24].y) / 2;
  const kneeY = (lm[25].y + lm[26].y) / 2;

  if (headY > 0.35) checks.push('請讓頭部在畫面上方');
  if (feetY < 0.65) checks.push('請讓腳部完整入鏡');

  // 身體各段必須有合理比例（排除只拍臉/半身的情況）
  const bodySpan = feetY - headY;
  if (bodySpan < 0.5) checks.push('請站遠一些，確保全身入鏡');

  // 身體各段順序正確：頭 < 肩 < 臀 < 膝 < 腳
  if (!(headY < shoulderY && shoulderY < hipY && hipY < kneeY && kneeY < feetY)) {
    checks.push('請正常站立面向鏡頭');
  }

  // 肩膀水平
  const shoulderTilt = Math.abs(lm[11].y - lm[12].y);
  if (shoulderTilt > 0.05) checks.push('請站直，肩膀保持水平');

  // 正面：雙肩可見且寬度足夠
  const shoulderWidth = Math.abs(lm[11].x - lm[12].x);
  if (shoulderWidth < 0.08) checks.push('請面向鏡頭');

  // 雙手微張（不要貼身）
  const lArmDist = Math.abs(lm[15].x - lm[23].x);
  const rArmDist = Math.abs(lm[16].x - lm[24].x);
  if (lArmDist < 0.03 && rArmDist < 0.03) checks.push('雙手微微張開，離開身體');

  if (checks.length === 0) return { ok: true, msg: '姿勢正確 ✓' };
  return { ok: false, msg: checks[0] };
}

export default function BodyMeasure({ userProfile, onSave }) {
  const [phase, setPhase] = useState('intro');
  const [measurements, setMeasurements] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [landmarker, setLandmarker] = useState(null);
  const [poseStatus, setPoseStatus] = useState({ ok: false, msg: '準備中...' });
  const [countdown, setCountdown] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [tilt, setTilt] = useState(0); // 手機傾斜角度
  const [lastSpoke, setLastSpoke] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const countdownRef = useRef(null);
  const lastSpokeTime = useRef(0);

  const userHeight = userProfile?.height || 175;

  // 語音提示（防止重複播報）
  const speak = useCallback((text) => {
    const now = Date.now();
    if (text === lastSpoke && now - lastSpokeTime.current < 4000) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW';
    u.rate = 1.1;
    u.volume = 1;
    window.speechSynthesis.speak(u);
    setLastSpoke(text);
    lastSpokeTime.current = now;
  }, [lastSpoke]);

  // 手機水平偵測
  useEffect(() => {
    if (phase !== 'camera') return;
    const handler = (e) => {
      const gamma = Math.abs(e.gamma || 0); // 左右傾斜
      setTilt(gamma);
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, [phase]);

  // 初始化 MediaPipe（改為 VIDEO 模式）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const pl = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (!cancelled) setLandmarker(pl);
      } catch (e) {
        console.error('MediaPipe init failed:', e);
        if (!cancelled) setError('AI 模型載入失敗');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 開啟相機
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => setCameraReady(true);
      }
    } catch (e) {
      setError('無法開啟相機：' + e.message);
    }
  };

  // 關閉相機
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCameraReady(false);
  };

  // 即時姿勢偵測 loop
  useEffect(() => {
    if (phase !== 'camera' || !cameraReady || !landmarker || !videoRef.current) return;
    let lastTime = 0;

    const detect = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) { animFrameRef.current = requestAnimationFrame(detect); return; }

      const now = performance.now();
      if (now - lastTime < 200) { animFrameRef.current = requestAnimationFrame(detect); return; } // 5fps 就夠
      lastTime = now;

      try {
        const result = landmarker.detectForVideo(video, now);
        const lm = result.landmarks?.[0];
        const status = checkPose(lm, video.videoWidth, video.videoHeight);
        setPoseStatus(status);

        // 畫骨架 overlay
        const oc = overlayCanvasRef.current;
        if (oc && lm) {
          oc.width = video.videoWidth;
          oc.height = video.videoHeight;
          const ctx = oc.getContext('2d');
          ctx.clearRect(0, 0, oc.width, oc.height);
          const color = status.ok ? '#2ECC71' : '#FF5733';
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.fillStyle = color;
          [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28]].forEach(([a,b]) => {
            ctx.beginPath();
            ctx.moveTo(lm[a].x * oc.width, lm[a].y * oc.height);
            ctx.lineTo(lm[b].x * oc.width, lm[b].y * oc.height);
            ctx.stroke();
          });
          [0,11,12,13,14,15,16,23,24,25,26,27,28].forEach(i => {
            ctx.beginPath();
            ctx.arc(lm[i].x * oc.width, lm[i].y * oc.height, 4, 0, 2 * Math.PI);
            ctx.fill();
          });
        }

        // 手機傾斜檢查
        const isTilted = tilt > 8;
        if (isTilted) {
          speak('請將手機擺正');
        } else if (!status.ok) {
          speak(status.msg);
        } else if (status.ok && !isTilted) {
          speak('姿勢正確，準備拍照');
        }

        // 姿勢正確 + 手機水平 → 自動開始倒數
        if (status.ok && !isTilted && countdown === null) {
          startCountdown();
        } else if ((!status.ok || isTilted) && countdown !== null) {
          clearInterval(countdownRef.current);
          setCountdown(null);
        }
      } catch {}

      animFrameRef.current = requestAnimationFrame(detect);
    };
    animFrameRef.current = requestAnimationFrame(detect);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [phase, cameraReady, landmarker, countdown]);

  // 倒數 3 秒
  const startCountdown = () => {
    setCountdown(3);
    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(countdownRef.current);
        setCountdown(null);
        capturePhoto();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  // 拍照
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    stopCamera();
    setPhase('processing');
  };

  // 處理拍照結果
  useEffect(() => {
    if (phase !== 'processing' || !photo || !landmarker) return;
    // 切回 IMAGE 模式處理
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const imgLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
        });

        const img = new Image();
        img.onload = () => {
          const result = imgLandmarker.detect(img);
          const lm = result.landmarks?.[0];
          if (!lm) { setError('分析失敗，請重新拍攝'); setPhase('camera'); startCamera(); return; }

          const m = calcMeasurements(lm, userHeight, img.width, img.height);
          if (!m) { setError('計算失敗，請重新拍攝'); setPhase('camera'); startCamera(); return; }

          setMeasurements(m);
          setPhase('results');

          // 畫骨架
          if (canvasRef.current) {
            const c = canvasRef.current;
            c.width = img.width; c.height = img.height;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);
            ctx.strokeStyle = '#2ECC71'; ctx.lineWidth = 3; ctx.fillStyle = '#2ECC71';
            [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28]].forEach(([a,b]) => {
              ctx.beginPath();
              ctx.moveTo(lm[a].x * img.width, lm[a].y * img.height);
              ctx.lineTo(lm[b].x * img.width, lm[b].y * img.height);
              ctx.stroke();
            });
            [0,11,12,13,14,15,16,23,24,25,26,27,28].forEach(i => {
              ctx.beginPath();
              ctx.arc(lm[i].x * img.width, lm[i].y * img.height, 5, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
        };
        img.src = photo;
      } catch (e) {
        setError('處理失敗: ' + e.message);
        setPhase('camera');
        startCamera();
      }
    })();
  }, [phase, photo]);

  // Cleanup
  useEffect(() => { return () => stopCamera(); }, []);

  const reset = () => {
    setPhoto(null);
    setMeasurements(null);
    setError('');
    setCountdown(null);
    setPhase('camera');
    startCamera();
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
            使用相機即時偵測你的姿勢，姿勢正確後自動倒數 3 秒拍照。
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2">拍攝要求</p>
            {['穿著貼身衣物', '全身入鏡（頭頂到腳底）', 'A-Pose：雙手微張、雙腳與肩同寬', '背景簡潔、光線充足'].map((t, i) => (
              <p key={i} className="text-white/40 text-xs flex items-center gap-2"><span className="text-[#FF5733]">•</span> {t}</p>
            ))}
          </div>
          <p className="text-white/20 text-[10px] mb-4">身高 {userHeight} cm 用於校準</p>
          <button onClick={() => { setPhase('camera'); startCamera(); }}
            className="w-full bg-[#FF5733] text-white font-black py-4 rounded-[2rem] shadow-xl uppercase italic tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            <Camera size={20} /> 開啟相機
          </button>
        </GlassCard>
      </div>
    );
  }

  // --- Camera Live View ---
  const isTilted = tilt > 8;
  if (phase === 'camera') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 bg-black" style={{ aspectRatio: '9/16', maxHeight: '70vh' }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ transform: 'scaleX(-1)' }} />

          {/* 人形輪廓引導（SVG 人形） */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 120 300" className="h-[70%] opacity-20" fill="none" stroke={poseStatus.ok && !isTilted ? '#2ECC71' : 'white'} strokeWidth="2">
              {/* 頭 */}
              <circle cx="60" cy="25" r="18" />
              {/* 身體 */}
              <line x1="60" y1="43" x2="60" y2="150" />
              {/* 肩膀 */}
              <line x1="20" y1="65" x2="100" y2="65" />
              {/* 左手（微張） */}
              <line x1="20" y1="65" x2="5" y2="140" />
              {/* 右手（微張） */}
              <line x1="100" y1="65" x2="115" y2="140" />
              {/* 左腿 */}
              <line x1="60" y1="150" x2="35" y2="280" />
              {/* 右腿 */}
              <line x1="60" y1="150" x2="85" y2="280" />
            </svg>
          </div>

          {/* 手機水平指示器 */}
          {isTilted && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none animate-pulse">
              <div className="bg-red-500/90 backdrop-blur-xl px-4 py-2 rounded-full text-xs font-black text-white flex items-center gap-2">
                📐 手機傾斜 {Math.round(tilt)}° — 請擺正
              </div>
              <div className="mt-2 w-20 h-1 bg-white/10 rounded-full relative">
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full transition-all" style={{ left: `${50 + tilt}%` }} />
              </div>
            </div>
          )}

          {/* 狀態指示 */}
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-black backdrop-blur-xl ${poseStatus.ok && !isTilted ? 'bg-[#2ECC71]/80 text-black' : 'bg-[#FF5733]/80 text-white'}`}>
            {isTilted ? '📐 請將手機擺正' : poseStatus.msg}
          </div>

          {/* 倒數 */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center border-4 border-[#2ECC71]">
                <span className="text-6xl font-black text-[#2ECC71] italic">{countdown}</span>
              </div>
            </div>
          )}

          {/* 手動拍照按鈕 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-white/30 shadow-2xl active:scale-90 transition-all flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300" />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold justify-center">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <p className="text-white/20 text-[10px] text-center">姿勢正確後會自動倒數 3 秒拍照，或按下方按鈕手動拍攝</p>
      </div>
    );
  }

  // --- Processing ---
  if (phase === 'processing') {
    return (
      <div className="space-y-8 animate-fade-in flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-16 h-16 border-4 border-[#FF5733]/30 border-t-[#FF5733] rounded-full animate-spin" />
        <p className="text-white/40 font-black tracking-widest text-xs uppercase">AI 正在分析...</p>
      </div>
    );
  }

  // --- Results ---
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-black text-white italic uppercase">測量結果</h2>
        <p className="text-white/30 text-xs mt-2">AI 姿勢辨識 + 身高校準</p>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-80 flex justify-center bg-black">
        <canvas ref={canvasRef} className="max-h-80 object-contain" />
      </div>
      <GlassCard>
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2"><Ruler size={14} /> 測量數據</h3>
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
        <p className="text-[10px] text-white/20 text-center mt-3">圍度為估算值，適合追蹤變化趨勢</p>
      </GlassCard>
      <div className="flex gap-3">
        <button onClick={reset} className="flex-1 py-4 rounded-[2rem] font-black text-sm text-white/40 border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
          <RotateCcw size={16} /> 重新拍攝
        </button>
        <button onClick={() => { if (onSave && measurements) onSave({ ...measurements, date: new Date().toISOString(), photo }); }}
          className="flex-1 bg-[#FF5733] text-white font-black py-4 rounded-[2rem] shadow-xl uppercase italic active:scale-95 transition-all flex items-center justify-center gap-2">
          <Check size={16} /> 儲存結果
        </button>
      </div>
    </div>
  );
}
