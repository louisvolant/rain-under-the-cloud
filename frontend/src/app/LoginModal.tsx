// src/app/LoginModal.tsx
'use client';

import { useState } from 'react';
import { login } from '@/lib/login_api';
import { useRouter } from 'next/navigation';

export default function LoginModal() {
 const [isOpen, setIsOpen] = useState(false);
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const router = useRouter();

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 await login(username, password);
 setIsOpen(false);
 router.push('/account');
 } catch (err) {
 setError('Invalid credentials');
 }
 };

 return (
 <>
 <button className="btn btn-secondary" onClick={() => setIsOpen(true)}>
 Login
 </button>

 {isOpen && (
 <div className="modal modal-open">
 <div className="modal-box">
 <h3 className="font-bold text-lg">Login</h3>
 <form onSubmit={handleSubmit}>
 <div className="form-control">
 <label className="label">
 <span className="label-text">Username or Email</span>
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
 <div className="modal-action">
 <button type="submit" className="btn btn-primary">Login</button>
 <button
 type="button"
 className="btn"
 onClick={() => setIsOpen(false)}
 >
 Close
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </>
 );
}