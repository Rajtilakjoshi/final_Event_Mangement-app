import React, { useState, useRef, useEffect } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import QrReader from 'react-qr-scanner';
import { API_BASE_URL } from '../utils/apiUtils';

const PhotoUploader = () => {
    const [image1, setImage1] = useState(null);
    const [image2, setImage2] = useState(null);
    const videoRef = useRef(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showQrScanner, setShowQrScanner] = useState(true);
    const [scannedToken, setScannedToken] = useState('');
    const [userData, setUserData] = useState(null);
    const [imageToCapture, setImageToCapture] = useState(1); // State to track which image to capture
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState("");

    const captureImage = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg');
        if (imageToCapture === 1) {
            setImage1(imageSrc);
            setImageToCapture(2);
        } else {
            setImage2(imageSrc);
            setImageToCapture(1);
        }
    };

    const handleUpload = async () => {
        if ((image1 || image2) && scannedToken && userData) {
            try {
                let uploaded = [];
                if (image1) {
                    console.log('Uploading face image...');
                    const blob1 = await fetch(image1).then(res => res.blob());
                    console.log('Face image blob created');
                    const fileName1 = `images/${scannedToken}_${userData.name.firstName}_${userData.name.lastName}_face.jpg`;
                    const storageRef1 = ref(storage, fileName1);
                    await uploadBytes(storageRef1, blob1);
                    console.log('Face image uploaded to Firebase');
                    const url1 = await getDownloadURL(storageRef1);
                    console.log('Face image download URL:', url1);
                    uploaded.push(url1);
                }
                if (image2) {
                    console.log('Uploading document image...');
                    const blob2 = await fetch(image2).then(res => res.blob());
                    console.log('Document image blob created');
                    const fileName2 = `images/${scannedToken}_${userData.name.firstName}_${userData.name.lastName}_doc.jpg`;
                    const storageRef2 = ref(storage, fileName2);
                    await uploadBytes(storageRef2, blob2);
                    console.log('Document image uploaded to Firebase');
                    const url2 = await getDownloadURL(storageRef2);
                    console.log('Document image download URL:', url2);
                    uploaded.push(url2);
                }
                alert('Images uploaded to Firebase! URLs:\n' + uploaded.join('\n'));
                resetStates();
            } catch (error) {
                console.error('Error uploading images:', error);
                alert(`Error uploading images: ${error.message}`);
            }
        } else {
            alert('No images or token available.');
        }
    };

    const resetStates = () => {
        setImage1(null);
        setImage2(null);
        setScannedToken('');
        setShowCamera(false);
        setShowQrScanner(true);
        setUserData(null);
        setImageToCapture(1); // Reset to capture the first image next
    };

    const [showError, setShowError] = useState(false);

    const handleScan = async (data) => {
        if (data && !showError) {
            const scannedToken = data.text;
            setScannedToken(scannedToken);
            try {
                console.log("[PhotoUploader] Fetching user for token:", scannedToken);
                const userResponse = await fetch(`${API_BASE_URL}/api/user/token/${scannedToken}`);
                if (!userResponse.ok) {
                    setShowError(true);
                    alert('User not found');
                    setTimeout(() => setShowError(false), 1500);
                    return;
                }
                const userInfo = await userResponse.json();
                setUserData(userInfo.user || null);
                if (userResponse.status === 200) {
                    setShowQrScanner(false);
                    setImage1(null);
                    setImage2(null);
                    setCameraReady(false); // Wait for user to click
                    setShowCamera(true);
                    setImageToCapture(1);
                }
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    };

    const handleError = (err) => {
        console.error(err);
    };

    const getPhotoUrl = (photoUrl) => {
    const baseUrl = API_BASE_URL || "http://localhost:5000";
    return `${baseUrl}/${photoUrl}`;
    };

    useEffect(() => {
        if (showCamera && cameraReady && videoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })
                .then(stream => {
                    videoRef.current.srcObject = stream;
                })
                .catch(err => {
                    setCameraError("Camera access denied or not available. Please check browser permissions and device camera.");
                });
        }
        // Stop camera on cleanup
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [showCamera, cameraReady]);

    return (
        <>
            {showQrScanner && (
                <div className="text-center">
                    <h2 className="text-lg font-bold mb-4 text-black">Step 1: Scan QR Code</h2>
                    <div className="qr-reader-container relative">
                        <QrReader
                            delay={300}
                            style={{ width: '100%' }}
                            onError={handleError}
                            onScan={handleScan}
                            constraints={{ video: { facingMode: "environment" } }}
                        />
                        <div className="absolute inset-0 flex justify-center items-center">
                            <div className="relative w-64 h-64 border-4 border-green-500">
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-scan"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCamera && userData && userData.name && !cameraReady && (
                <div className="p-6 text-center">
                    <h3 className="text-lg font-bold mb-4">Step 2: Capture Images</h3>
                    <div className="mb-2 text-base font-semibold">Token: {userData.token}</div>
                    <div className="mb-4 text-base font-semibold">Name: {userData.name.firstName} {userData.name.lastName}</div>
                    <button
                        onClick={() => { setCameraReady(true); setCameraError(""); }}
                        className="mb-4 px-6 py-3 bg-green-700 text-white rounded hover:bg-green-600 text-lg"
                    >
                        Click to Open Camera
                    </button>
                    {cameraError && (
                        <div className="text-red-600 font-bold mt-2">{cameraError}</div>
                    )}
                </div>
            )}
            {showCamera && userData && userData.name && cameraReady && (
                <div className="p-6 text-center">
                    <h3 className="text-lg font-bold mb-4">Step 2: Capture Images</h3>
                    <div className="mb-2 text-base font-semibold">Token: {userData.token}</div>
                    <div className="mb-4 text-base font-semibold">Name: {userData.name.firstName} {userData.name.lastName}</div>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="border border-gray-300 rounded mb-4"
                        style={{ width: '100%', maxWidth: 400 }}
                    />
                    <button
                        onClick={captureImage}
                        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                    >
                        {imageToCapture === 1 && !image1 ? "Capture Profile Photo" : "Capture Document Photo"}
                    </button>
                    {image1 && (
                        <div className="mb-4">
                            <img src={image1} alt="Captured Image 1" className="w-64 h-64 object-cover border mb-2" />
                            <button
                                onClick={() => { setImage1(null); setImageToCapture(1); }}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
                            >
                                Retake Profile Photo
                            </button>
                        </div>
                    )}
                    {image2 && (
                        <div className="mb-4">
                            <img src={image2} alt="Captured Image 2" className="w-64 h-64 object-cover border mb-2" />
                            <button
                                onClick={() => { setImage2(null); setImageToCapture(2); }}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
                            >
                                Retake Document Photo
                            </button>
                        </div>
                    )}
                    <div>
                        <button
                            onClick={handleUpload}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                        >
                            Upload Photos
                        </button>
                    </div>

                    {cameraError && (
                        <div className="text-red-600 font-bold mt-2">{cameraError}</div>
                    )}
                </div>
            )}

            {showCamera && (!userData || !userData.name) && (
                <div className="border-2 border-red-400 p-4 rounded-lg bg-white w-full max-w-md mx-auto my-5 shadow-md flex flex-col items-center">
                    <h4 className="text-lg font-bold mb-4 text-red-600">Guest not found</h4>
                    <button
                        onClick={resetStates}
                        className="mt-4 px-5 py-3 bg-purple-500 text-white rounded transition-colors duration-300 hover:bg-purple-400 w-full"
                    >
                        Scan Again
                    </button>
                </div>
            )}
        </>
    );
};

export default PhotoUploader;
