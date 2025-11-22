import React, { useState } from 'react';
import { signup as signupService } from '../services/authService';
import Header from './Header';
import Footer from './Footer';

interface SignupProps {
    onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [collegeEmail, setCollegeEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signupService(username, password, collegeEmail || undefined);
            setSuccess(true);
            setTimeout(() => {
                onSwitchToLogin();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to sign up');
            setIsLoading(false);
        }
    };

    return (
        <div className="text-slate-800 min-h-screen font-sans flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto p-4 md:p-6 flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
                        <p className="text-slate-500 mt-2">Join us to track your performance</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 text-sm">
                            <p>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6 text-sm">
                            <p>Account created successfully! Redirecting...</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="Choose a username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="Create a strong password"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                College Email <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="email"
                                value={collegeEmail}
                                onChange={(e) => setCollegeEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="you@college.edu"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className={`w-full bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-secondary transition-colors font-medium flex items-center justify-center ${isLoading || success ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-600">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-brand-primary hover:underline font-medium"
                            >
                                Log In
                            </button>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Signup;
