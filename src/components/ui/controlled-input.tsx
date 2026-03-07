import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface ControlledInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  [key: string]: any;
}

export function ControlledInput({ 
  value, 
  onChange, 
  type = "text", 
  disabled = false, 
  min, 
  max,
  ...props 
}: ControlledInputProps) {
  const [tempValue, setTempValue] = useState(value.toString());
  const [error, setError] = useState("");

  // Sync tempValue with prop value when it changes (for increment/decrement updates)
  useEffect(() => {
    setTempValue(value.toString());
    setError("");
  }, [value]);

  const validateInput = (inputValue: string): boolean => {
    if (type === "number") {
      const numValue = Number(inputValue);
      
      if (inputValue && isNaN(numValue)) {
        setError("Must be a number");
        return false;
      }
      
      if (min !== undefined && numValue < min) {
        setError(`Must be at least ${min}`);
        return false;
      }
      
      if (max !== undefined && numValue > max) {
        setError(`Must be at most ${max}`);
        return false;
      }
    }
    
    setError("");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const newValue = e.target.value;
    setTempValue(newValue);
    
    // Validate on change for immediate feedback
    validateInput(newValue);
  };

  const handleBlur = () => {
    if (disabled) return;
    
    if (!validateInput(tempValue)) {
      // Reset to original value if invalid
      setTempValue(value.toString());
      return;
    }
    
    if (type === "number") {
      const numValue = Number(tempValue) || 0;
      if (numValue !== Number(value)) {
        onChange(numValue);
      }
    } else {
      if (tempValue !== value) {
        onChange(tempValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.key === 'Enter') {
      if (!validateInput(tempValue)) {
        // Reset to original value if invalid
        setTempValue(value.toString());
        return;
      }
      
      if (type === "number") {
        const numValue = Number(tempValue) || 0;
        if (numValue !== Number(value)) {
          onChange(numValue);
        }
      } else {
        if (tempValue !== value) {
          onChange(tempValue);
        }
      }
    }
  };

  return (
    <div className="relative">
      <Input
        {...props}
        value={tempValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={error ? "border-red-500 focus:border-red-500" : ""}
      />
      {error && (
        <span className="text-xs text-red-500 mt-1 absolute -bottom-5 left-0">
          {error}
        </span>
      )}
    </div>
  );
}
