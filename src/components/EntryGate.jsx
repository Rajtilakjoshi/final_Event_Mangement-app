import React, { useState, useEffect, useCallback } from 'react';
import QrReader from 'react-qr-scanner';
import { API_BASE_URL } from '../utils/apiUtils';

const QRScannerEntryGate = () => {
    const [prasadData, setPrasadDataState] = useState(null);
    const [showQrScannerEntry, setShowQrScannerEntry] = useState(true);
    const [userData, setUserData] = useState(null);
    const [showUserForm, setShowUserForm] = useState(false);
    const [scannedToken, setScannedToken] = useState('');



    const setPrasadData = useCallback((data) => {
        setPrasadDataState(data);
    }, []);

    useEffect(() => {
        console.log('prasadData:', prasadData);
        console.log('setPrasadData is defined:', typeof setPrasadData === 'function');
    }, [prasadData, setPrasadData]);

    const updateEntryGateStatus = async (scannedToken) => {
        try {
            const updateResponse = await fetch(`${API_BASE_URL}/api/prasad/entry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: scannedToken,
                    entryGate: true,
                }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update entry gate status');
            }

            const updateResult = await updateResponse.json();
            console.log('Entry gate status update response:', updateResult);
            alert('Entry gate status updated successfully!');

            // Refresh prasadData after update
            const prasadResponse = await fetch(`${API_BASE_URL}/api/prasad/status?token=${scannedToken}`);
            if (prasadResponse.ok) {
                const prasadInfo = await prasadResponse.json();
                setPrasadData(prasadInfo);
            }

            keepQrRunning();
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while updating the entry gate status. Please try again.');
        }
    };

    const [showError, setShowError] = useState(false);

    const handleScan = async (data) => {
        if (data && !showError) {
            const scannedToken = data.text; // Extract the token from the QR code
            setScannedToken(scannedToken); // Set the scanned token in state

            // Fetch user information using the scanned token
            try {
                const response = await fetch(`${API_BASE_URL}/api/user/token/${scannedToken}`);
                if (!response.ok) {
                    setShowError(true);
                    alert('Failed to fetch user info');
                    setTimeout(() => setShowError(false), 1500);
                    return;
                }

                const userInfo = await response.json();
                // Fix: use userInfo.user as per backend response
                setUserData(userInfo.user || null);

                // Fetch prasad status using the same token
                const prasadResponse = await fetch(`${API_BASE_URL}/api/prasad/status?token=${scannedToken}`);
                if (prasadResponse.status === 404) {
                    alert(`allow entry`);
                }

                if (prasadResponse.status === 200) {
                    const prasadInfo = await prasadResponse.json();
                    setPrasadData(prasadInfo); // Set the prasad data
                }

                setShowUserForm(true); // Show the user form

            } catch (error) {
                setShowError(true);
                alert(`Error: ${error.message}`);
                setTimeout(() => setShowError(false), 1500);
            } finally {
                setShowQrScannerEntry(false); // Close the scanner
            }
        }
    };

    const handleError = (err) => {
        console.error(err);
    };

    const getPhotoUrl = (photoUrl) => {
        return `${API_BASE_URL}/${photoUrl}`;
    };

    const keepQrRunning = () => {
        setShowQrScannerEntry(true);
    };
    // Reset states function to clear image, prasad, and token data
    const resetStates = () => {
        setScannedToken('');
        setUserData(null);
        setPrasadData(null);
        setShowUserForm(false);
    };

    return (
        <div>
            {showQrScannerEntry && (
                <div>
                    <h2 className="text-lg font-bold mb-4 text-black">Scan QR Code</h2>

                    <div className="qr-reader-container relative">
                        <QrReader
                            delay={300}
                            style={{ width: '100%' }}
                            onError={handleError}
                            onScan={handleScan}
                            constraints={{
                                video: { facingMode: "environment" }
                            }}
                        />

                        {/* Square border and scanning effect */}
                        <div className="absolute inset-0 flex justify-center items-center">
                            <div className="relative w-64 h-64 border-4 border-green-500">
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-scan"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Form */}
            {showUserForm && userData && (
                <div className="relative border-2 border-gray-200 p-4 rounded-lg bg-white w-full max-w-md mx-auto my-5 shadow-md">
                    <h4 className="text-lg font-bold mb-4 text-black">User Details</h4>
                    <form className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col mb-2">
                            <div className="flex justify-center mb-3">
                                <img
                                    src={getPhotoUrl(userData?.photoUrl)}
                                    alt={`${userData?.name?.firstName || ''} ${userData?.name?.lastName || ''}`}
                                    className="w-30 h-30 rounded-full object-cover"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">First Name:</label>
                            <input
                                type="text"
                                value={userData?.name?.firstName || ''}
                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">Middle Name:</label>
                            <input
                                type="text"
                                value={userData?.name?.middleName || ''}
                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">Last Name:</label>
                            <input
                                type="text"
                                value={userData?.name?.lastName || ''}
                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">Token:</label>
                            <input
                                type="text"
                                value={userData?.token || ''}
                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">Gender:</label>
                            <input
                                type="text"
                                value={userData?.gender || ''}
                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">Age:</label>
                            <input
                                type="text"
                                value={userData?.age || ''}
                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">Email:</label>
                            <input
                                type="text"
                                value={userData?.email || ''}
                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">Phone Number:</label>
                            <input
                                type="text"
                                value={userData?.phoneNumber || ''}
                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">Alternate Phone Number:</label>
                            <input
                                type="text"
                                value={userData?.alternatePhoneNumber || ''}
                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label className="font-bold text-black text-sm mb-1">Entry Gate Pass</label>
                            <input
                                type="text"
                                value={prasadData?.prasad?.entryGate || ''}

                                readOnly
                                className="border border-[rgb(174,107,224)] rounded px-2 py-1 bg-white text-black text-base w-full box-border"
                            />
                        </div>
                    </form>

                    {prasadData?.prasad?.entryGate === true && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                            <p className="text-red-500 text-lg font-bold mb-4">User already allowed entry!</p>
                            <button
                                onClick={() => {
                                    setShowUserForm(false);
                                    setShowQrScannerEntry(true); // Reopen QR scanner
                                    resetStates(); // Reset the states
                                }}
                                className="px-5 py-3 bg-purple-500 text-white rounded transition-colors duration-300 hover:bg-purple-400"
                            >
                                Reopen Scanner
                            </button>
                        </div>
                    )}

                    {prasadData?.prasad?.entryGate !== true && (
                        <button
                            onClick={() => {
                                updateEntryGateStatus(scannedToken);
                                setShowUserForm(false);
                            }}
                            className="mt-4 px-5 py-3 bg-purple-500 text-white rounded transition-colors duration-300 hover:bg-purple-400 w-full"
                        >
                            Confirm and Update Entry Gate Status
                        </button>
                    )}
                </div>
            )}


        </div>
    );
};

export default QRScannerEntryGate;
