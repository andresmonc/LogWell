import { useState } from 'react';

interface FormField<T = string> {
  value: T;
  setValue: (value: T) => void;
}

interface FormStateConfig {
  [key: string]: any;
}

type FormStateReturn<T extends FormStateConfig> = {
  [K in keyof T]: FormField<T[K]>;
} & {
  resetForm: () => void;
  getFormValues: () => T;
  setFormValues: (values: Partial<T>) => void;
};

export function useFormState<T extends FormStateConfig>(
  initialValues: T
): FormStateReturn<T> {
  const [formState, setFormState] = useState<T>(initialValues);

  const resetForm = () => {
    setFormState(initialValues);
  };

  const getFormValues = () => formState;

  const setFormValues = (values: Partial<T>) => {
    setFormState(prev => ({ ...prev, ...values }));
  };

  // Create field objects for each form field
  const fields = {} as FormStateReturn<T>;
  
  Object.keys(initialValues).forEach((key) => {
    const typedKey = key as keyof T;
    (fields as any)[typedKey] = {
      value: formState[typedKey],
      setValue: (value: T[keyof T]) => {
        setFormState(prev => ({ ...prev, [key]: value }));
      }
    };
  });

  return {
    ...fields,
    resetForm,
    getFormValues,
    setFormValues
  };
}