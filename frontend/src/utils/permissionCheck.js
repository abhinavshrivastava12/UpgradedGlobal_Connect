export const checkMediaPermissions = async () => {
  try {
    // Check if browser supports media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        error: 'Your browser does not support camera/microphone access'
      };
    }

    // Check current permission state (if supported)
    if (navigator.permissions) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' });
        const micPermission = await navigator.permissions.query({ name: 'microphone' });
        
        if (cameraPermission.state === 'denied' || micPermission.state === 'denied') {
          return {
            success: false,
            error: 'Camera or microphone access is blocked. Please enable it in your browser settings.'
          };
        }
      } catch (e) {
        console.log('Permission API not fully supported, will try direct access');
      }
    }

    // Try to access media devices
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Success! Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      return { success: true };
    } catch (error) {
      let errorMessage = 'Camera/microphone access denied.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Please allow camera and microphone access to make video calls.\n\nSteps:\n1. Click the camera icon in your browser address bar\n2. Select "Allow"\n3. Try again';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found on your device';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to check media permissions: ' + error.message
    };
  }
};