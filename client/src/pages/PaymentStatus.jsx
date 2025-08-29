import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");
  const [paymentData, setPaymentData] = useState(null);

  const getStoredOrderItems = () => {
    try {
      const stored = localStorage.getItem('phonepe_order');
      if (stored) {
        const orderData = JSON.parse(stored);
        console.log('Stored order data:', orderData); // Debug log
        
        // Check if items exist and are valid
        if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
          console.log('Found items array:', orderData.items);
          return orderData.items;
        } else if (orderData.items && typeof orderData.items === 'object') {
          // Convert items object to array
          const itemsArray = Object.values(orderData.items);
          console.log('Converted items object to array:', itemsArray);
          return itemsArray;
        } else if (orderData.cartItems) {
          // Fallback to cartItems if items is not available
          const cartItems = Array.isArray(orderData.cartItems) 
            ? orderData.cartItems 
            : Object.values(orderData.cartItems || {});
          console.log('Using cartItems fallback:', cartItems);
          return cartItems;
        } else {
          console.log('Order data structure:', Object.keys(orderData));
        }
      } else {
        console.warn('No phonepe_order found in localStorage');
      }
    } catch (error) {
      console.error('Error getting stored order items:', error);
    }
    console.warn('No valid order items found in storage');
    return [];
  };

  const downloadFile = async (itemId) => {
    try {
      const stored = localStorage.getItem('phonepe_order');
      if (!stored) {
        alert('Order information not found. Please contact support.');
        return;
      }
      
      const orderData = JSON.parse(stored);
      // Get merchantOrderId from URL params or stored data
      const merchantOrderId = searchParams.get("merchantOrderId") || orderData.merchantOrderId || paymentData?.merchantOrderId;
      
      console.log('Attempting download:', { merchantOrderId, itemId });
      
      if (!merchantOrderId) {
        alert('Order ID not found. Please contact support.');
        return;
      }
      
      // Use fetch to handle the download properly
      const response = await fetch(`http://localhost:8080/api/payment/phonepe/download/${merchantOrderId}/${itemId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        console.error('Download failed:', errorData);
        alert(`Download failed: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      // Get the blob and create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${orderData.items.find(item => item.id === itemId)?.title || 'download'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again or contact support.');
    }
  };

  useEffect(() => {
    const merchantOrderId = searchParams.get("merchantOrderId");
    
    if (!merchantOrderId) {
      setStatus("error");
      return;
    }

    checkPaymentStatus(merchantOrderId);
  }, [searchParams]);

  const checkPaymentStatus = async (merchantOrderId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/payment/phonepe/check-status?merchantOrderId=${merchantOrderId}`
      );

      if (response.data.ok) {
        const paymentStatus = response.data.data.status;
        setPaymentData(response.data.data);
        
        if (paymentStatus === "COMPLETED") {
          setStatus("success");
        } else if (paymentStatus === "FAILED") {
          setStatus("failed");
        } else {
          setStatus("pending");
        }
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      setStatus("error");
    }
  };

  const handleReturnHome = () => {
    navigate("/");
  };

  const renderStatusContent = () => {
    switch (status) {
      case "checking":
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Checking Payment Status...</h2>
            <p className="text-gray-600">Please wait while we verify your payment.</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your payment has been processed successfully.</p>
            {paymentData && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Order ID: {paymentData.merchantOrderId}</p>
              </div>
            )}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Download Your Files</h3>
              <div className="space-y-2">
                {getStoredOrderItems().map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">₹{item.price}</p>
                    </div>
                    <button
                      onClick={() => downloadFile(item.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Download PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "failed":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">Your payment could not be processed. Please try again.</p>
            {paymentData && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Order ID: {paymentData.merchantOrderId}</p>
              </div>
            )}
          </div>
        );

      case "pending":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-yellow-600 mb-2">Payment Pending</h2>
            <p className="text-gray-600 mb-4">Your payment is being processed. Please wait.</p>
            {paymentData && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Order ID: {paymentData.merchantOrderId}</p>
              </div>
            )}
          </div>
        );

      case "error":
      default:
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">Unable to check payment status. Please contact support.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center w-96">
        {renderStatusContent()}
        <button
          onClick={handleReturnHome}
          className="w-full mt-6 bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}

export default PaymentStatus;
