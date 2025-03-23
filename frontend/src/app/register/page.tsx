// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { register } from '@/lib/login_api';
import { useRouter } from 'next/navigation';

export default function Register() {
 const [username, setUsername] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const router = useRouter();

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 await register(username, email, password);
 router.push('/account');
 } catch (err: any) {
 setError(err.response?.data?.error || 'Registration failed');
 }
 };

 return (
 <div className="flex justify-center items-center min-h-screen">
 <div className="card w-96 bg-base-100 shadow-xl">
 <div className="card-body">
 <h2 className="card-title ">Register</h2>
 <form onSubmit={handleSubmit}>
 <div className="form-control">
 <label className="label">
 <span className="label-text">Username</span>
 </label>
 <input
 type="text"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 className="input input-bordered"
 required
 />
 </div>
 <div className="form-control">
 <label className="label">
 <span className="label-text">Email</span>
 </label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="input input-bordered"
 required
 />
 </div>
 <div className="form-control">
 <label className="label">
 <span className="label-text">Password</span>
 </label>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="input input-bordered"
 required
 />
 </div>
 {error && <p className="text-red-500 mt-2">{error}</p>}
 <div className="form-control mt-6">
 <button type="submit" className="btn btn-primary">Register</button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
}