// "use client";

// import { useState, useRef, useCallback, useEffect } from "react";
// import {
//   Camera as CameraIcon,
//   X,
//   RefreshCw,
//   Image as ImageIcon,
//   Upload,
//   Zap,
//   ZapOff,
//   Maximize2,
//   Sun,
//   CheckCircle2,
//   AlertCircle,
// } from "lucide-react";
// import Image from 'next/image'


// // ========== টাইপ ==========
// interface CameraProps {
//   onCapture: (images: string[]) => void;
//   onClose: () => void;
//   maxImages?: number;
//   currentCount?: number;
//   title?: string;
// }

// // ========== মেইন কম্পোনেন্ট ==========
// export default function CameraCapture({
//   onCapture,
//   onClose,
//   maxImages = 5,
//   currentCount = 0,
//   title = "ছবি তুলুন",
// }: CameraProps) {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const [mode, setMode] = useState<"camera" | "gallery">("camera");
//   const [isCameraReady, setIsCameraReady] = useState(false);
//   const [isCameraError, setCameraError] = useState("");
//   const [flashOn, setFlashOn] = useState(false);
//   const [facingMode, setFacingMode] = useState<"environment" | "user">(
//     "environment"
//   );
//   const [capturedImages, setCapturedImages] = useState<string[]>([]);
//   const [selectedPreview, setSelectedPreview] = useState<number | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);

//   const remainingSlots = maxImages - currentCount - capturedImages.length;

//   // ========== ক্যামেরা স্টার্ট ==========
//   const startCamera = useCallback(async () => {
//     // আগের স্ট্রিম বন্ধ
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((track) => track.stop());
//     }

//     setCameraError("");
//     setIsCameraReady(false);

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: {
//           facingMode: facingMode,
//           width: { ideal: 1920 },
//           height: { ideal: 1080 },
//         },
//         audio: false,
//       });

//       streamRef.current = stream;

//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         videoRef.current.onloadedmetadata = () => {
//           setIsCameraReady(true);
//         };
//       }
//     } catch (error: any) {
//       console.error("Camera error:", error);
//       if (error.name === "NotAllowedError") {
//         setCameraError(
//           "ক্যামেরা পারমিশন দেওয়া হয়নি। দয়া করে ব্রাউজার সেটিংস থেকে ক্যামেরা পারমিশন দিন।"
//         );
//       } else if (error.name === "NotFoundError") {
//         setCameraError("ক্যামেরা পাওয়া যায়নি। গ্যালারি থেকে ছবি নিন।");
//         setMode("gallery");
//       } else {
//         setCameraError("ক্যামেরা চালু করতে সমস্যা হয়েছে। গ্যালারি ব্যবহার করুন।");
//         setMode("gallery");
//       }
//     }
//   }, [facingMode]);

//   // ========== ক্যামেরা স্টপ ==========
//   const stopCamera = useCallback(() => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((track) => track.stop());
//       streamRef.current = null;
//     }
//     if (videoRef.current) {
//       videoRef.current.srcObject = null;
//     }
//     setIsCameraReady(false);
//   }, []);

//   // ========== মোড চেঞ্জ হলে ক্যামেরা স্টার্ট/স্টপ ==========
//   useEffect(() => {
//     if (mode === "camera") {
//       startCamera();
//     } else {
//       stopCamera();
//     }
//     return () => stopCamera();
//   }, [mode, startCamera, stopCamera]);

//   // ========== ফেসিং মোড চেঞ্জ ==========
//   useEffect(() => {
//     if (mode === "camera" && isCameraReady) {
//       startCamera();
//     }
//   }, [facingMode]);

//   // ========== ছবি ক্যাপচার ==========
//   const captureImage = useCallback(() => {
//     if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     const context = canvas.getContext("2d");

//     if (!context) return;

//     // ক্যানভাস সাইজ সেট
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     // ফ্ল্যাশ ইফেক্ট
//     if (flashOn) {
//       context.fillStyle = "white";
//       context.fillRect(0, 0, canvas.width, canvas.height);
//     }

//     // ভিডিও ফ্রেম ক্যাপচার
//     context.drawImage(video, 0, 0, canvas.width, canvas.height);

//     // ফ্রন্ট ক্যামেরা হলে মিরর
//     if (facingMode === "user") {
//       context.save();
//       context.scale(-1, 1);
//       context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
//       context.restore();
//     }

//     // ইমেজ কম্প্রেস করে base64
//     const imageData = canvas.toDataURL("image/jpeg", 0.8);

//     setCapturedImages((prev) => [...prev, imageData]);
//     setFlashOn(false);
//   }, [isCameraReady, flashOn, facingMode]);

//   // ========== গ্যালারি থেকে আপলোড ==========
//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;

//     setIsProcessing(true);

//     const newImages: string[] = [];
//     const allowedSlots = remainingSlots;

//     for (let i = 0; i < Math.min(files.length, allowedSlots); i++) {
//       const file = files[i];
//       const compressed = await compressImageFile(file);
//       newImages.push(compressed);
//     }

//     setCapturedImages((prev) => [...prev, ...newImages]);
//     setIsProcessing(false);

//     // Reset input
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   // ========== ইমেজ কম্প্রেশন (ফাইল থেকে) ==========
//  const compressImageFile = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const img = document.createElement("img"); // ✅ এভাবে ক্রিয়েট করুন
//       img.onload = () => {
//         const canvas = document.createElement("canvas");
//         const maxWidth = 1200;
//         const ratio = maxWidth / img.width;
//         canvas.width = maxWidth;
//         canvas.height = img.height * ratio;

//         const ctx = canvas.getContext("2d");
//         if (!ctx) {
//           reject(new Error("Canvas context not available"));
//           return;
//         }
        
//         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//         resolve(canvas.toDataURL("image/jpeg", 0.7));
//       };
//       img.onerror = () => reject(new Error("Image load failed"));
//       img.src = e.target?.result as string;
//     };
//     reader.onerror = () => reject(new Error("File read failed"));
//     reader.readAsDataURL(file);
//   });
// };

//   // ========== ইমেজ রিমুভ ==========
//   const removeImage = (index: number) => {
//     setCapturedImages((prev) => prev.filter((_, i) => i !== index));
//     if (selectedPreview === index) setSelectedPreview(null);
//   };

//   // ========== ডান (সব ইমেজ সাবমিট) ==========
//   const handleDone = () => {
//     if (capturedImages.length > 0) {
//       onCapture(capturedImages);
//     }
//     onClose();
//   };

//   // ========== ফ্ল্যাশ টগল ==========
//   const toggleFlash = () => {
//     setFlashOn(!flashOn);
//     if (videoRef.current) {
//       // @ts-ignore - Flash API (সব ডিভাইসে কাজ নাও করতে পারে)
//       const track = streamRef.current?.getVideoTracks()[0];
//       if (track && "torch" in track.getCapabilities()) {
//         track.applyConstraints({
//           advanced: [{ torch: !flashOn } as any],
//         });
//       }
//     }
//   };

//   // ========== কীবোর্ড শর্টকাট ==========
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Escape") onClose();
//       if (e.key === " " || e.key === "Enter") {
//         e.preventDefault();
//         if (mode === "camera" && isCameraReady && remainingSlots > 0) {
//           captureImage();
//         }
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [onClose, mode, isCameraReady, remainingSlots, captureImage]);

//   return (
//     <div className="fixed inset-0 z-[200] bg-black flex flex-col">
//       {/* ========== হেডার ========== */}
//       <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
//         <button
//           onClick={onClose}
//           className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
//         >
//           <X className="w-5 h-5 text-white" />
//         </button>

//         <h2 className="text-white font-semibold text-lg">{title}</h2>

//         <div className="flex items-center gap-2">
//           {/* বাকি স্লট */}
//           <span className="text-white/70 text-sm">
//             {capturedImages.length}/{maxImages - currentCount}
//           </span>

//           {/* ক্যামেরা/গ্যালারি টগল */}
//           <button
//             onClick={() => setMode(mode === "camera" ? "gallery" : "camera")}
//             className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
//             title={mode === "camera" ? "গ্যালারি" : "ক্যামেরা"}
//           >
//             {mode === "camera" ? (
//               <ImageIcon className="w-5 h-5 text-white" />
//             ) : (
//               <CameraIcon className="w-5 h-5 text-white" />
//             )}
//           </button>
//         </div>
//       </div>

//       {/* ========== মেইন কন্টেন্ট ========== */}
//       <div className="flex-1 relative overflow-hidden">
//         {/* ===== ক্যামেরা মোড ===== */}
//         {mode === "camera" && (
//           <div className="h-full relative">
//             {/* ক্যামেরা ফিড */}
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               muted
//               className="h-full w-full object-cover"
//               style={{
//                 transform: facingMode === "user" ? "scaleX(-1)" : "none",
//               }}
//             />

//             {/* ক্যামেরা লোডিং ওভারলে */}
//             {!isCameraReady && !isCameraError && (
//               <div className="absolute inset-0 flex items-center justify-center bg-black/60">
//                 <div className="text-center text-white">
//                   <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3" />
//                   <p>ক্যামেরা চালু হচ্ছে...</p>
//                 </div>
//               </div>
//             )}

//             {/* ক্যামেরা এরর ওভারলে */}
//             {isCameraError && (
//               <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-8">
//                 <div className="text-center text-white max-w-xs">
//                   <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
//                   <p className="mb-4 text-sm">{isCameraError}</p>
//                   <button
//                     onClick={() => setMode("gallery")}
//                     className="px-6 py-2.5 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors"
//                   >
//                     গ্যালারি থেকে নিন
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* ফ্ল্যাশ ইফেক্ট */}
//             {flashOn && isCameraReady && (
//               <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
//             )}

//             {/* ক্যামেরা গ্রিড ওভারলে */}
//             {isCameraReady && (
//               <div className="absolute inset-0 pointer-events-none">
//                 {/* কর্নার গাইড */}
//                 <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
//                 <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
//                 <div className="absolute bottom-36 left-8 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
//                 <div className="absolute bottom-36 right-8 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-lg" />
//               </div>
//             )}

//             {/* টপ কন্ট্রোল (ক্যামেরা রেডি থাকলে) */}
//             {isCameraReady && (
//               <div className="absolute top-4 right-4 flex flex-col gap-2">
//                 {/* ফ্ল্যাশ টগল */}
//                 <button
//                   onClick={toggleFlash}
//                   className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
//                     flashOn
//                       ? "bg-yellow-400 text-black"
//                       : "bg-white/20 text-white"
//                   }`}
//                   title={flashOn ? "ফ্ল্যাশ বন্ধ" : "ফ্ল্যাশ চালু"}
//                 >
//                   {flashOn ? (
//                     <Zap className="w-5 h-5" />
//                   ) : (
//                     <ZapOff className="w-5 h-5" />
//                   )}
//                 </button>

//                 {/* ক্যামেরা ফ্লিপ */}
//                 <button
//                   onClick={() =>
//                     setFacingMode(
//                       facingMode === "environment" ? "user" : "environment"
//                     )
//                   }
//                   className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-white"
//                   title="ক্যামেরা ফ্লিপ"
//                 >
//                   <RefreshCw className="w-5 h-5" />
//                 </button>
//               </div>
//             )}

//             {/* নিচের কন্ট্রোল বার */}
//             <div className="absolute bottom-0 left-0 right-0 pb-safe">
//               {/* ক্যাপচার করা ইমেজ প্রিভিউ */}
//               {capturedImages.length > 0 && (
//                 <div className="flex justify-center gap-2 mb-4 px-4 overflow-x-auto">
//                   {capturedImages.map((img, index) => (
//                     <button
//                       key={index}
//                       onClick={() => setSelectedPreview(index)}
//                       className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
//                         selectedPreview === index
//                           ? "border-blue-400 scale-110"
//                           : "border-white/30 opacity-70 hover:opacity-100"
//                       }`}
//                     >
//                       <Image
//                         width={100}
//                         height={100}
//                         src={img}
//                         alt={`ছবি ${index + 1}`}
//                         className="w-full h-full object-cover"
//                       />
//                     </button>
//                   ))}
//                 </div>
//               )}

//               {/* অ্যাকশন বার */}
//               <div className="flex items-center justify-center gap-8 pb-6 px-4">
//                 {/* গ্যালারি বাটন */}
//                 <button
//                   onClick={() => fileInputRef.current?.click()}
//                   disabled={remainingSlots <= 0}
//                   className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
//                 >
//                   <ImageIcon className="w-6 h-6 text-white" />
//                 </button>

//                 {/* ক্যাপচার বাটন */}
//                 <button
//                   onClick={captureImage}
//                   disabled={!isCameraReady || remainingSlots <= 0}
//                   className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <div className="w-[68px] h-[68px] rounded-full bg-white" />
//                 </button>

//                 {/* ডান বাটন */}
//                 {capturedImages.length > 0 ? (
//                   <button
//                     onClick={handleDone}
//                     className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
//                   >
//                     <CheckCircle2 className="w-6 h-6 text-white" />
//                   </button>
//                 ) : (
//                   <div className="w-12 h-12" />
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ===== গ্যালারি মোড ===== */}
//         {mode === "gallery" && (
//           <div className="h-full flex flex-col items-center justify-center p-8">
//             {/* গ্যালারি আপলোড এরিয়া */}
//             <button
//               onClick={() => fileInputRef.current?.click()}
//               disabled={remainingSlots <= 0 || isProcessing}
//               className="w-full max-w-sm border-2 border-dashed border-white/30 rounded-2xl p-10 flex flex-col items-center gap-4 hover:border-white/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isProcessing ? (
//                 <>
//                   <RefreshCw className="w-12 h-12 animate-spin text-white/60" />
//                   <p className="text-white/60">প্রসেসিং...</p>
//                 </>
//               ) : (
//                 <>
//                   <Upload className="w-12 h-12 text-white/60" />
//                   <div className="text-center text-white">
//                     <p className="font-medium mb-1">গ্যালারি থেকে ছবি নির্বাচন করুন</p>
//                     <p className="text-sm text-white/50">
//                       সর্বোচ্চ {remainingSlots} টি ছবি (JPG, PNG)
//                     </p>
//                   </div>
//                 </>
//               )}
//             </button>

//             {/* ক্যাপচার করা ইমেজ প্রিভিউ (গ্যালারি মোডেও) */}
//             {capturedImages.length > 0 && (
//               <div className="mt-6 w-full max-w-sm">
//                 <p className="text-white/70 text-sm mb-3">
//                   নির্বাচিত ছবি ({capturedImages.length})
//                 </p>
//                 <div className="grid grid-cols-4 gap-2">
//                   {capturedImages.map((img, index) => (
//                     <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
//                       <Image
//                         src={img}
//                         alt={`ছবি ${index + 1}`}
//                         className="w-full h-full object-cover"
//                         width={100}
//                         height={100}
//                       />
//                       <button
//                         onClick={() => removeImage(index)}
//                         className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                       >
//                         <X className="w-3 h-3 text-white" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* ক্যামেরায় ফিরুন */}
//             <button
//               onClick={() => setMode("camera")}
//               className="mt-6 px-6 py-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors flex items-center gap-2"
//             >
//               <CameraIcon className="w-5 h-5" />
//               ক্যামেরা ব্যবহার করুন
//             </button>
//           </div>
//         )}
//       </div>

//       {/* ========== হিডেন ফাইল ইনপুট ========== */}
//       <input
//         ref={fileInputRef}
//         type="file"
//         accept="image/*"
//         multiple
//         capture="environment"
//         onChange={handleFileUpload}
//         className="hidden"
//       />

//       {/* ========== হিডেন ক্যানভাস ========== */}
//       <canvas ref={canvasRef} className="hidden" />

//       {/* ========== ফ্ল্যাশ অ্যানিমেশন স্টাইল ========== */}
//       <style jsx>{`
//         @keyframes flash {
//           0% {
//             opacity: 1;
//           }
//           100% {
//             opacity: 0;
//           }
//         }
//         .animate-flash {
//           animation: flash 0.3s ease-out forwards;
//         }
//       `}</style>
//     </div>
//   );
// }
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera as CameraIcon,
  X,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Zap,
  ZapOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
} from "lucide-react";

// ========== টাইপ ==========
interface CameraProps {
  onCapture: (images: string[]) => void;
  onClose: () => void;
  maxImages?: number;
  currentCount?: number;
  title?: string;
}

// ========== মেইন কম্পোনেন্ট ==========
export default function CameraCapture({
  onCapture,
  onClose,
  maxImages = 5,
  currentCount = 0,
  title = "ছবি তুলুন",
}: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"camera" | "gallery" | "preview">("camera");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraError, setCameraError] = useState("");
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const remainingSlots = maxImages - currentCount - capturedImages.length;

  // ========== ক্যামেরা স্টার্ট ==========
  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setCameraError("");
    setIsCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      if (error.name === "NotAllowedError") {
        setCameraError(
          "ক্যামেরা পারমিশন দেওয়া হয়নি। দয়া করে ব্রাউজার সেটিংস থেকে ক্যামেরা পারমিশন দিন।"
        );
      } else if (error.name === "NotFoundError") {
        setCameraError("ক্যামেরা পাওয়া যায়নি। গ্যালারি থেকে ছবি নিন।");
        setMode("gallery");
      } else {
        setCameraError("ক্যামেরা চালু করতে সমস্যা হয়েছে। গ্যালারি ব্যবহার করুন।");
        setMode("gallery");
      }
    }
  }, [facingMode]);

  // ========== ক্যামেরা স্টপ ==========
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  useEffect(() => {
    if (mode === "camera" && isCameraReady) {
      startCamera();
    }
  }, [facingMode]);

  // ========== ছবি ক্যাপচার ==========
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;
    if (remainingSlots <= 0) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // ফ্ল্যাশ ইফেক্ট
    if (flashOn) {
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ফ্রন্ট ক্যামেরা হলে মিরর
    if (facingMode === "user") {
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImages((prev) => [...prev, imageData]);
    setFlashOn(false);

    // সব স্লট ফিল হলে প্রিভিউতে চলে যান
    if (capturedImages.length + 1 >= maxImages - currentCount) {
      setMode("preview");
    }
  }, [isCameraReady, flashOn, facingMode, remainingSlots, capturedImages.length, maxImages, currentCount]);

  // ========== গ্যালারি থেকে আপলোড ==========
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    const newImages: string[] = [];
    const allowedSlots = remainingSlots;

    for (let i = 0; i < Math.min(files.length, allowedSlots); i++) {
      const file = files[i];
      const compressed = await compressImageFile(file);
      newImages.push(compressed);
    }

    setCapturedImages((prev) => [...prev, ...newImages]);
    setIsProcessing(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ========== ইমেজ কম্প্রেশন ==========
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 1200;
          const ratio = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * ratio;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  };

  // ========== ইমেজ রিমুভ ==========
  const removeImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ========== ডান — সব ইমেজ সাবমিট ==========
  const handleDone = () => {
    if (capturedImages.length > 0) {
      onCapture(capturedImages);
    }
    onClose();
  };

  // ========== ফ্ল্যাশ টগল ==========
  const toggleFlash = () => {
    setFlashOn(!flashOn);
    if (videoRef.current) {
      try {
        const track = streamRef.current?.getVideoTracks()[0];
        if (track) {
          track.applyConstraints({
            advanced: [{ torch: !flashOn } as any],
          });
        }
      } catch (e) {
        // Torch not supported
      }
    }
  };

  // ========== কীবোর্ড শর্টকাট ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (mode === "camera" && isCameraReady && remainingSlots > 0) {
          captureImage();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, mode, isCameraReady, remainingSlots, captureImage]);

  // ========== প্রিভিউ মোড থেকে ক্যামেরায় ফেরা ==========
  const goBackToCamera = () => {
    if (capturedImages.length >= maxImages - currentCount) {
      // স্লট ফুল, সরাসরি done
      handleDone();
    } else {
      setMode("camera");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* ========== হেডার ========== */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <h2 className="text-white font-semibold text-lg">
          {mode === "preview" ? "ছবি নির্বাচন" : title}
        </h2>

        {/* Done Button (দেখাচ্ছে যখন ছবি আছে) */}
        {capturedImages.length > 0 && mode !== "preview" ? (
          <button
            onClick={() => setMode("preview")}
            className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
          >
            Done
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : mode === "preview" ? (
          <button
            onClick={handleDone}
            className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* ========== মেইন কন্টেন্ট ========== */}
      <div className="flex-1 relative overflow-hidden">
        {/* ===== প্রিভিউ মোড ===== */}
        {mode === "preview" && (
          <div className="h-full flex flex-col">
            {/* ইমেজ গ্রিড */}
            <div className="flex-1 overflow-y-auto p-4">
              {capturedImages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/50">
                  <ImageIcon className="w-16 h-16 mb-4" />
                  <p className="text-lg">কোনো ছবি নেই</p>
                  <button
                    onClick={goBackToCamera}
                    className="mt-4 px-6 py-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
                  >
                    ছবি তুলুন
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {capturedImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden group border-2 border-white/20"
                    >
                      <img
                        src={img}
                        alt={`ছবি ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Remove Button */}
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      {/* Index Badge */}
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {index + 1}
                      </div>
                    </div>
                  ))}

                  {/* Add More Button (যদি স্লট বাকি থাকে) */}
                  {capturedImages.length < maxImages - currentCount && (
                    <button
                      onClick={goBackToCamera}
                      className="aspect-square border-2 border-dashed border-white/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-white/60 transition-colors text-white/60 hover:text-white/90"
                    >
                      <Plus className="w-10 h-10" />
                      <span className="text-sm">আরও যোগ করুন</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* নিচের অ্যাকশন বার (প্রিভিউ মোড) */}
            <div className="border-t border-white/10 p-4 pb-safe flex gap-3">
              <button
                onClick={goBackToCamera}
                className="flex-1 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                {capturedImages.length >= maxImages - currentCount
                  ? "ফিরে যান"
                  : "আরও যোগ করুন"}
              </button>
              <button
                onClick={handleDone}
                disabled={capturedImages.length === 0}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Done ({capturedImages.length})
              </button>
            </div>
          </div>
        )}

        {/* ===== ক্যামেরা মোড ===== */}
        {mode === "camera" && (
          <div className="h-full relative">
            {/* ক্যামেরা ফিড */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />

            {/* ক্যামেরা লোডিং ওভারলে */}
            {!isCameraReady && !isCameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center text-white">
                  <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3" />
                  <p>ক্যামেরা চালু হচ্ছে...</p>
                </div>
              </div>
            )}

            {/* ক্যামেরা এরর ওভারলে */}
            {isCameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-8">
                <div className="text-center text-white max-w-xs">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="mb-4 text-sm">{isCameraError}</p>
                  <button
                    onClick={() => setMode("gallery")}
                    className="px-6 py-2.5 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors"
                  >
                    গ্যালারি থেকে নিন
                  </button>
                </div>
              </div>
            )}

            {/* ফ্ল্যাশ ইফেক্ট */}
            {flashOn && isCameraReady && (
              <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
            )}

            {/* ক্যামেরা গ্রিড ওভারলে */}
            {isCameraReady && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
                <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
                <div className="absolute bottom-40 left-8 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
                <div className="absolute bottom-40 right-8 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-lg" />
              </div>
            )}

            {/* টপ কন্ট্রোল */}
            {isCameraReady && (
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {/* ফ্ল্যাশ টগল */}
                <button
                  onClick={toggleFlash}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    flashOn
                      ? "bg-yellow-400 text-black"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {flashOn ? (
                    <Zap className="w-5 h-5" />
                  ) : (
                    <ZapOff className="w-5 h-5" />
                  )}
                </button>

                {/* ক্যামেরা ফ্লিপ */}
                <button
                  onClick={() =>
                    setFacingMode(
                      facingMode === "environment" ? "user" : "environment"
                    )
                  }
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-white"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* স্লট ইন্ডিকেটর (উপরে বামে) */}
            {isCameraReady && (
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                {capturedImages.length}/{maxImages - currentCount}
              </div>
            )}

            {/* নিচের কন্ট্রোল বার */}
            <div className="absolute bottom-0 left-0 right-0 pb-safe">
              {/* ক্যাপচার করা ইমেজ প্রিভিউ স্ট্রিপ */}
              {capturedImages.length > 0 && (
                <div className="flex justify-center gap-2 mb-4 px-4">
                  <div className="flex gap-2 overflow-x-auto max-w-full py-2">
                    {capturedImages.map((img, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-white/40 relative"
                      >
                        <img
                          src={img}
                          alt={`ছবি ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Remove mini button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* অ্যাকশন বার */}
              <div className="flex items-center justify-center gap-8 pb-6 px-4">
                {/* গ্যালারি বাটন */}
                <button
                  onClick={() => setMode("gallery")}
                  disabled={remainingSlots <= 0}
                  className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ImageIcon className="w-6 h-6 text-white" />
                </button>

                {/* ক্যাপচার বাটন */}
                <button
                  onClick={captureImage}
                  disabled={!isCameraReady || remainingSlots <= 0}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-[68px] h-[68px] rounded-full bg-white" />
                </button>

                {/* Done / Preview Button */}
                {capturedImages.length > 0 ? (
                  <button
                    onClick={() => setMode("preview")}
                    className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg"
                  >
                    <ArrowRight className="w-6 h-6 text-white" />
                  </button>
                ) : (
                  <div className="w-12 h-12" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== গ্যালারি মোড ===== */}
        {mode === "gallery" && (
          <div className="h-full flex flex-col items-center justify-center p-8">
            {/* গ্যালারি আপলোড এরিয়া */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={remainingSlots <= 0 || isProcessing}
              className="w-full max-w-sm border-2 border-dashed border-white/30 rounded-2xl p-10 flex flex-col items-center gap-4 hover:border-white/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-12 h-12 animate-spin text-white/60" />
                  <p className="text-white/60">প্রসেসিং...</p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-white/60" />
                  <div className="text-center text-white">
                    <p className="font-medium mb-1">
                      গ্যালারি থেকে ছবি নির্বাচন করুন
                    </p>
                    <p className="text-sm text-white/50">
                      সর্বোচ্চ {remainingSlots} টি (JPG, PNG)
                    </p>
                  </div>
                </>
              )}
            </button>

            {/* ক্যাপচার করা ইমেজ প্রিভিউ */}
            {capturedImages.length > 0 && (
              <div className="mt-6 w-full max-w-sm">
                <p className="text-white/70 text-sm mb-3">
                  নির্বাচিত ({capturedImages.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {capturedImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <img
                        src={img}
                        alt={`ছবি ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Done Button (গ্যালারি মোডে) */}
            {capturedImages.length > 0 && (
              <button
                onClick={handleDone}
                className="mt-6 px-8 py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-colors flex items-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5" />
                Done — {capturedImages.length} টি ছবি
              </button>
            )}

            {/* ক্যামেরায় ফিরুন */}
            <button
              onClick={() => setMode("camera")}
              className="mt-4 px-6 py-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <CameraIcon className="w-5 h-5" />
              ক্যামেরা ব্যবহার করুন
            </button>
          </div>
        )}
      </div>

      {/* ========== হিডেন ইনপুট ========== */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ========== হিডেন ক্যানভাস ========== */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ========== ফ্ল্যাশ অ্যানিমেশন ========== */}
      <style jsx>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}