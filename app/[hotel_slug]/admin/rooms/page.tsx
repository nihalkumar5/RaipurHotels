"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import { Printer, Key, DoorClosed, Plus, Trash2 } from "lucide-react";
import { useHotelBranding, useRooms, addRoom, checkInRoom, checkOutRoom, deleteRoom } from "@/utils/store";

export default function RoomsPage() {
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { branding } = useHotelBranding(hotelSlug);
    const { rooms: initialRooms, loading } = useRooms(branding?.id);
    const [roomsList, setRoomsList] = React.useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newRoomNumber, setNewRoomNumber] = useState("");

    React.useEffect(() => {
        if (initialRooms) {
            setRoomsList(initialRooms);
        }
    }, [initialRooms]);

    const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

    const handleAddRoom = async () => {
        if (!branding?.id || !newRoomNumber.trim()) return;

        // Client-side validation: Check if room already exists
        if (roomsList.some(r => r.room_number === newRoomNumber.trim())) {
            alert("This room number already exists.");
            return;
        }

        const { error } = await addRoom(branding.id, newRoomNumber.trim());

        if (error) {
            alert(error.message || "Failed to add room.");
            return;
        }

        setNewRoomNumber("");
        setIsAdding(false);
    };

    const [checkInDetails, setCheckInDetails] = useState<{ roomId: string, date: string, time: string, numGuests: number } | null>(null);

    const handleCheckIn = async (roomId: string) => {
        if (!branding?.id || !checkInDetails) return;
        const { pin, error } = await checkInRoom(roomId, branding.id, checkInDetails.date, checkInDetails.time, checkInDetails.numGuests);

        if (error) {
            console.error("Check-in Error:", error);
            alert(`Failed to check in: ${error.message || "Unknown error"}. Check if database schema is updated.`);
            return;
        }

        // The hook (useRooms) will handle real-time updates from Supabase or Custom Event
        setCheckInDetails(null);
        alert(`Room Checked In! Guests must use the generated PIN: ${pin} to access the menu.`);
    };

    const handleCheckOut = async (roomId: string) => {
        if (!branding?.id) return;
        if (confirm("Check out this room? The guest will immediately lose access to the digital menu.")) {
            await checkOutRoom(roomId, branding.id);

            // The hook (useRooms) will handle real-time updates
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!branding?.id) return;
        if (confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
            await deleteRoom(roomId, branding.id);
            // Remove manual filter; useRooms hook handles it
        }
    };

    const handlePrintQR = (roomNumber: string, qrUrl: string) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR - Room ${roomNumber}</title>
                    <style>
                        body { 
                            font-family: 'Inter', sans-serif; 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            height: 100vh; 
                            margin: 0;
                            text-align: center;
                        }
                        .qr-container { padding: 40px; border: 2px solid #eee; border-radius: 40px; }
                        h1 { font-size: 48px; margin-bottom: 10px; font-weight: 900; color: #1e293b; }
                        p { font-size: 18px; color: #64748b; margin-bottom: 30px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 900; }
                    </style>
                </head>
                <body>
                    <h1>Room ${roomNumber}</h1>
                    <p>Scan for Digital Concierge</p>
                    <div id="qr" class="qr-container"></div>
                    <script type="text/javascript">
                        window.onload = function() {
                            // Inject QR code using SVG from parent context for simplicity
                            const qrSvg = window.opener.document.querySelector('.qr-container-target-${roomNumber} svg').outerHTML;
                            document.getElementById('qr').innerHTML = qrSvg;
                            window.print();
                            window.onafterprint = function() { window.close(); };
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight" style={{ color: branding?.primaryColor }}>Rooms & Check-In</h1>
                    <p className="text-slate-500 font-medium">Manage access and generate security PINs</p>
                </div>
                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:opacity-90 transition-all flex items-center active:scale-95"
                        style={{ backgroundColor: branding?.primaryColor }}
                    >
                        <Plus className="w-5 h-5 mr-2" /> Add New Room
                    </button>
                ) : (
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newRoomNumber}
                            onChange={(e) => setNewRoomNumber(e.target.value)}
                            placeholder="Room Number (e.g. 101)"
                            className="px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none"
                            autoFocus
                        />
                        <button onClick={handleAddRoom} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold">Save</button>
                        <button onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold">Cancel</button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : roomsList.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                    <DoorClosed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-slate-900">No rooms added yet</h3>
                    <p className="text-slate-500 mt-2">Click the button above to start adding rooms.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {roomsList.map((room) => {
                        const qrUrl = `${appUrl}/${hotelSlug}/guest/dashboard?room=${room.room_number}`;
                        return (
                            <div key={room.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center relative group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                {room.is_occupied ? (
                                    <div className="absolute top-6 right-6 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                                        Occupied
                                    </div>
                                ) : (
                                    <div className="absolute top-6 right-6 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                                        Available
                                    </div>
                                )}

                                <h2 className="text-3xl font-black mb-1 text-slate-900 mt-4">{room.room_number}</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Room</p>

                                <div className={`bg-white p-6 rounded-[2rem] border-2 border-dashed border-slate-100 mb-6 group-hover:border-blue-100 transition-colors qr-container-target-${room.room_number}`}>
                                    <QRCode value={qrUrl} size={140} level="M" />
                                </div>

                                {room.is_occupied ? (
                                    <div className="w-full">
                                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Booking PIN</p>
                                                <p className="text-2xl font-black text-amber-900 tracking-widest">{room.booking_pin}</p>
                                            </div>
                                            <Key className="text-amber-300 w-8 h-8" />
                                        </div>
                                        {room.checkout_date && (
                                            <div className="mb-4 text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Check-out</p>
                                                <p className="text-sm font-bold text-slate-700">{room.checkout_date} at {room.checkout_time || '11:00 AM'}</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleCheckOut(room.id)}
                                            className="w-full flex items-center justify-center py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                                        >
                                            Check Out Guest
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        {checkInDetails?.roomId === room.id ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1 ml-1">Date</label>
                                                        <input
                                                            type="date"
                                                            value={checkInDetails!.date}
                                                            onChange={(e) => setCheckInDetails({ ...checkInDetails!, date: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1 ml-1">Time</label>
                                                        <input
                                                            type="time"
                                                            value={checkInDetails!.time}
                                                            onChange={(e) => setCheckInDetails({ ...checkInDetails!, time: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1 ml-1">Number of Guests</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={checkInDetails!.numGuests}
                                                        onChange={(e) => setCheckInDetails({ ...checkInDetails!, numGuests: parseInt(e.target.value) || 1 })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCheckIn(room.id)}
                                                        className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
                                                        style={{ backgroundColor: branding?.primaryColor }}
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setCheckInDetails(null)}
                                                        className="px-4 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95 text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setCheckInDetails({ roomId: room.id, date: new Date().toISOString().split('T')[0], time: "11:00", numGuests: 1 })}
                                                className="w-full flex items-center justify-center py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                                style={{ backgroundColor: branding?.primaryColor }}
                                            >
                                                Check In Guest
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="w-full flex gap-3 mt-3">
                                    <button
                                        onClick={() => handlePrintQR(room.room_number, qrUrl)}
                                        className="flex-1 flex items-center justify-center py-3 bg-slate-50 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
                                    >
                                        <Printer className="w-4 h-4 mr-2" /> Print QR
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRoom(room.id)}
                                        className="px-4 py-3 bg-red-50 text-red-500 font-bold rounded-xl hover:bg-red-100 transition-all border border-red-50 flex items-center justify-center"
                                        title="Delete Room"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
