'use client'

export default function TestBioDigitalPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 BioDigital Model Test - Model 6PxP
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Library Model: 6PxP
          </h2>
          
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <iframe 
              id="embedded-human" 
              frameBorder="0" 
              style={{ aspectRatio: '4 / 3', width: '100%', height: '600px' }}
              allowFullScreen={true}
              loading="lazy" 
              src="https://human.biodigital.com/viewer/?id=6PxP&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=true&ui-chapter-list=false&ui-fullscreen=true&ui-help=true&ui-info=true&ui-label-list=true&ui-layers=true&ui-skin-layers=true&ui-loader=circle&ui-media-controls=full&ui-menu=true&ui-nav=true&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=true&initial.none=true&disable-scroll=false&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0&paid=o_0866e6f1"
              title="BioDigital 3D Model 6PxP"
            />
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Model Details:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Model ID:</strong> 6PxP</li>
              <li><strong>API Key:</strong> f3bc3cd6... (configured)</li>
              <li><strong>Features:</strong> Full UI, descriptions, labels, tools, search</li>
              <li><strong>Aspect Ratio:</strong> 4:3</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ This is a direct embed of your BioDigital library model without any complex logic.
              If this works, we know your model and credentials are correct.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
