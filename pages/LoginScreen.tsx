import React from 'react';

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    return (
        <div className="flex items-center justify-center h-screen bg-surface dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-main">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-ink dark:text-gray-50">Masuma<span className="text-brand-orange">POS</span></h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to your account</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                defaultValue="admin@masuma.co.ke"
                                className="w-full px-3 py-2 border border-surface-2 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                defaultValue="password"
                                className="w-full px-3 py-2 border border-surface-2 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
                                placeholder="Password"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-orange hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
