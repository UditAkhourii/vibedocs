export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] text-zinc-300 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-4">Terms and Conditions</h1>
                    <p className="text-sm text-zinc-500">Last updated: January 4, 2026</p>
                </div>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Agreement to Terms</h2>
                    <p>
                        By accessing or using the SuperDocs website and services, you agree to be bound by these Terms.
                        If you disagree with any part of the terms, then you may not access the Service.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Intellectual Property</h2>
                    <p>
                        The Service and its original content (excluding Content provided by you or other users), features and functionality
                        are and will remain the exclusive property of SuperDocs and its licensors.
                    </p>
                    <p>
                        You retain all rights to the documentation generated from your code repositories.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. User Accounts</h2>
                    <p>
                        When you create an account with us, you must provide us information that is accurate, complete, and current at all times.
                        Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Termination</h2>
                    <p>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever,
                        including without limitation if you breach the Terms.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Limitation of Liability</h2>
                    <p>
                        In no event shall SuperDocs, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect,
                        incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill,
                        or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">6. Changes</h2>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
                        By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">7. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at:{" "}
                        <a href="mailto:support@superdocs.cloud" className="text-indigo-400 hover:text-indigo-300">support@superdocs.cloud</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
