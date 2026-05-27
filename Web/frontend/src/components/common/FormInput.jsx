import React from 'react';
export default function FormInput({ label, required = false, ...props }) {
  return (
    <label className="form-control">
      <span>
        {label}
        {required && <strong className="required-mark"> *</strong>}
      </span>
      <input required={required} {...props} />
    </label>
  );
}
