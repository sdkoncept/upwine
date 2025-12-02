export default function AboutPage() {
  return (
    <main className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">
          About Upwine
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-4">
            Fresh Palm Wine from Our Family Farm
          </h2>
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
            <p>
              Upwine is a seasonal palm wine brand based in Benin City. We tap from our own farm 
              and bottle under clean conditions. Our goal is to bring safe, fresh palm wine to homes, 
              offices, restaurants, and events in the city.
            </p>
            
            <p>
              We keep our weekly production at 100 bottles so every batch stays fresh. Each bottle 
              is tapped and bottled on the same day, ensuring you get the freshest natural palm wine 
              possible.
            </p>

            <h3 className="text-xl font-semibold text-primary mt-8 mb-4">
              Our Values
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-3xl mb-3">🧼</div>
                <h4 className="font-semibold text-lg mb-2">Clean Process</h4>
                <p className="text-gray-600">
                  We maintain strict hygiene standards in our bottling process to ensure your safety.
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-3xl mb-3">🌿</div>
                <h4 className="font-semibold text-lg mb-2">Honest Production</h4>
                <p className="text-gray-600">
                  No additives, no preservatives. Just pure, natural palm wine from our farm.
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-3xl mb-3">🍷</div>
                <h4 className="font-semibold text-lg mb-2">Natural Taste</h4>
                <p className="text-gray-600">
                  Every batch is unique, reflecting the natural variations of fresh palm wine.
                </p>
              </div>
            </div>

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                ⚡ Freshness Guarantee
              </h3>
              <p className="text-yellow-700">
                Palm wine stays fresh for 5 days. We bottle and deliver within 24 to 48 hours 
                to ensure you get the best taste experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

