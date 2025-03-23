// src/app/account/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { checkAuth, logout } from '@/lib/login_api';
import { useRouter } from 'next/navigation';

interface FavoriteLocation {
 id: string;
 location_name: string;
 longitude: number;
 latitude: number;
}

export default function Account() {
 const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const router = useRouter();

 useEffect(() => {
 const checkAuthentication = async () => {
 const authStatus = await checkAuth();
 if (!authStatus.isAuthenticated) {
 router.push('/');
 } else {
 setIsAuthenticated(true);
 // Fetch favorites - we'll implement this API endpoint later
 fetchFavorites();
 }
 };
 checkAuthentication();
 }, [router]);

 const fetchFavorites = async () => {
 try {
 const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/favorites`, {
 credentials: 'include'
 });
 const data = await response.json();
 setFavorites(data);
 } catch (err) {
 console.error('Error fetching favorites:', err);
 }
 };

 const handleLogout = async () => {
 await logout();
 router.push('/');
 };

 if (!isAuthenticated) return null;

 return (
 <div className="container mx-auto p-4">
 <div className="flex justify-between items-center mb-4">
 <h1 className="text-2xl font-bold">My Account</h1>
 <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
 </div>

 <div className="card bg-base-100 shadow-xl">
 <div className="card-body">
 <h2 className="card-title">My Favorite Locations</h2>
 <div className="overflow-x-auto">
 <table className="table w-full">
 <thead>
 <tr>
 <th>Location Name</th>
 <th>Latitude</th>
 <th>Longitude</th>
 </tr>
 </thead>
 <tbody>
 {favorites.map((fav) => (
 <tr key={fav.id}>
 <td>{fav.location_name}</td>
 <td>{fav.latitude}</td>
 <td>{fav.longitude}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 );
}