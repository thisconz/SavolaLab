import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-green-600">Welcome to SavolaLab</h1>
      <p className="text-gray-900 mt-4">We are a leading laboratory in the field of medical diagnostics.</p>
      <p className="text-gray-900 mt-4">Our mission is to provide accurate and reliable diagnostic services to healthcare professionals and patients.</p>
      <p className="text-gray-900 mt-4">Our team of experts is dedicated to delivering high-quality results and exceptional customer service.</p>
      <p className="text-gray-900 mt-4">Thank you for choosing SavolaLab for your diagnostic needs.</p>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md space-y-4">
        <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Login</Link>
      </div>
    </main>
  );
}
