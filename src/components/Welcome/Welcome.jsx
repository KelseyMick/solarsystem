import React, { useState } from 'react';
import './welcome.css'


const Welcome = ({ onClose }) => {
    const [visible, setVisible] = useState(true);

    const handleClose = () => {
        setVisible(false);
        onClose(); // Call the onClose callback from the parent component
    };

  return (
    <div className='welcome-overlay'>
        <div className='welcome-content'>
            <div className='welcome-headline'>
                <h1>Welcome to my solar system!</h1>
            </div>
            <div className='welcome-controls'>
                <h2>Controls:</h2>
                <h3>Use the mouse wheel to zoom in and out.</h3>
                <h3>Hold down the mouse button and drag to move the camera.</h3>
            </div>
            <div>
                <button className='welcome-button' onClick={handleClose}>Close</button>
            </div>
        </div>
    </div>
  );
};

export default Welcome;
