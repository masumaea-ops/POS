import React from 'react';

const MfaScreen: React.FC<{ onVerify: () => void }> = ({ onVerify }) => {
    return (
        <div className="flex items-center justify-center h-screen bg-surface dark:bg-gray-900">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-main">
                <div className="text-center">
                     <h1 className="text-2xl font-bold text-ink dark:text-gray-50">Two-Factor Authentication</h1>
                     <p className="mt-2 text-gray-500 dark:text-gray-400">Enter the code from your authenticator app.</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onVerify(); }}>
                    <div className="flex justify-center space-x-2">
                        {[...Array(6)].map((_, i) => (
                            <input
                                key={i}
                                type="text"
                                maxLength={1}
                                className="w-12 h-14 text-center text-2xl font-semibold border border-surface-2 dark:border-gray-600 rounded-md focus:outline-none focus:ring-brand-orange focus:border-brand-orange bg-white dark:bg-gray-700"
                                required
                            />
                        ))}
                    </div>
                     <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-orange hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
                        >
                            Verify
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MfaScreen;
