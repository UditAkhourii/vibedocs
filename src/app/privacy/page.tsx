export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] text-zinc-300 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
                    <p className="text-sm text-zinc-500">Last updated: January 4, 2026</p>
                </div>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
                    <p>
                        Welcome to SuperDocs. We respect your privacy and are committed to protecting your personal data.
                        This privacy policy will inform you as to how we look after your personal data when you use our
                        documentation generation services and visit our website.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Data We Collect</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Identity Data:</strong> includes username or similar identifier, and email address.</li>
                        <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
                        <li><strong>Usage Data:</strong> includes information about how you use our website and services, such as repositories processed.</li>
                        <li><strong>Content Data:</strong> We process the documentation and code snippets you submit for the sole purpose of generating documentation. We do not use your proprietary code to train our public models without consent.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. How We Use Your Data</h2>
                    <p>
                        We use your data to provide, operate, and maintain our Service, improve our Service, analyze how you use our Service,
                        and communicate with you either directly or through one of our partners.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Data Security</h2>
                    <p>
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
                        used or accessed in an unauthorized way, altered or disclosed. We use industry-standard encryption for data in transit and at rest.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Third-Party Links</h2>
                    <p>
                        Our Service may contain links to other websites that are not operated by us. If you click on a third-party link,
                        you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">6. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at:{" "}
                        <a href="mailto:support@superdocs.cloud" className="text-indigo-400 hover:text-indigo-300">support@superdocs.cloud</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
