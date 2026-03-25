import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import IndiaMapComponent from './IndiaMapComponent';

interface MapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onMessage?: (message: string) => void;
}

export const MapDrawer: React.FC<MapDrawerProps> = ({ isOpen, onClose, onMessage }) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Drawer Panel */}
          <motion.div
            className="relative ml-auto w-screen max-w-none bg-white shadow-2xl overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 40,
              duration: 0.3,
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
              aria-label="Close map drawer"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Map Component */}
              <div className="w-full h-screen overflow-hidden">
                  <IndiaMapComponent onMapMessage={onMessage} isVisible={isOpen} />
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapDrawer;
