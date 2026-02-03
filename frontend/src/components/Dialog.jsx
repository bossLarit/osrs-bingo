import { useState, createContext, useContext } from 'react';
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const showDialog = (options) => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        onClose: (result) => {
          setDialog(null);
          resolve(result);
        }
      });
    });
  };

  const confirm = (message, options = {}) => {
    return showDialog({
      type: 'confirm',
      title: options.title || 'Bekræft',
      message,
      confirmText: options.confirmText || 'Ja',
      cancelText: options.cancelText || 'Annuller',
      variant: options.variant || 'warning'
    });
  };

  const alert = (message, options = {}) => {
    return showDialog({
      type: 'alert',
      title: options.title || 'Besked',
      message,
      confirmText: options.confirmText || 'OK',
      variant: options.variant || 'info'
    });
  };

  const success = (message, options = {}) => {
    return showDialog({
      type: 'alert',
      title: options.title || 'Succes',
      message,
      confirmText: options.confirmText || 'OK',
      variant: 'success'
    });
  };

  const error = (message, options = {}) => {
    return showDialog({
      type: 'alert',
      title: options.title || 'Fejl',
      message,
      confirmText: options.confirmText || 'OK',
      variant: 'error'
    });
  };

  const prompt = (message, options = {}) => {
    return showDialog({
      type: 'prompt',
      title: options.title || 'Indtast',
      message,
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Annuller',
      defaultValue: options.defaultValue || '',
      placeholder: options.placeholder || '',
      inputType: options.inputType || 'text',
      variant: 'info'
    });
  };

  return (
    <DialogContext.Provider value={{ confirm, alert, success, error, prompt }}>
      {children}
      {dialog && <DialogModal {...dialog} />}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

function DialogModal({ type, title, message, confirmText, cancelText, variant, onClose, defaultValue, placeholder, inputType }) {
  const [inputValue, setInputValue] = useState(defaultValue || '');

  const icons = {
    warning: <AlertTriangle size={24} className="text-yellow-500" />,
    error: <X size={24} className="text-red-500" />,
    success: <CheckCircle size={24} className="text-green-500" />,
    info: <Info size={24} className="text-blue-500" />
  };

  const buttonColors = {
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    error: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  const handleConfirm = () => {
    if (type === 'prompt') {
      onClose(inputValue);
    } else {
      onClose(true);
    }
  };

  const handleCancel = () => {
    if (type === 'prompt') {
      onClose(null);
    } else {
      onClose(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[200] p-4"
      onClick={handleCancel}
    >
      <div 
        className="bg-[#f5e6c8] border-4 border-[#5c4a32] rounded-lg shadow-2xl max-w-md w-full transform scale-100"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b-2 border-osrs-border">
          {icons[variant]}
          <h3 className="text-lg font-bold text-osrs-brown flex-1">{title}</h3>
          <button 
            onClick={handleCancel}
            className="text-osrs-border hover:text-osrs-brown transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-osrs-dark leading-relaxed">{message}</p>
          
          {type === 'prompt' && (
            <input
              type={inputType}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className="input-osrs w-full mt-4 rounded"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') handleCancel();
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t-2 border-osrs-border bg-osrs-dark bg-opacity-5">
          {type === 'confirm' || type === 'prompt' ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded border-2 border-osrs-border text-osrs-brown font-semibold hover:bg-osrs-border hover:bg-opacity-20 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded text-white font-semibold transition-colors ${buttonColors[variant]}`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={handleConfirm}
              className={`px-6 py-2 rounded text-white font-semibold transition-colors ${buttonColors[variant]}`}
              autoFocus
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DialogProvider;
