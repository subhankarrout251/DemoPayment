// client/src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to Our Coaching Centre
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Quality education with comprehensive study materials and expert
          guidance for your academic success.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/shop?category=40"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Browse Study Materials
          </Link>
          <Link
            to="/admission"
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium"
          >
            Apply for Admission
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 py-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 text-3xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">
            Quality Study Materials
          </h3>
          <p className="text-gray-600">
            Comprehensive notes and books curated by experts to help you excel
            in your studies.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 text-3xl mb-4">🎓</div>
          <h3 className="text-xl font-semibold mb-2">Expert Faculty</h3>
          <p className="text-gray-600">
            Learn from experienced teachers who are dedicated to your academic
            success.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 text-3xl mb-4">💻</div>
          <h3 className="text-xl font-semibold mb-2">Modern Learning</h3>
          <p className="text-gray-600">
            Access digital resources and interactive sessions for a complete
            learning experience.
          </p>
        </div>
      </div>
    </div>
  );
}
