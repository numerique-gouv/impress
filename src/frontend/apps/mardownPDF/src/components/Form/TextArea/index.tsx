import {TextAreaProps as CTextAreaProps, TextArea as CTextArea} from "@openfun/cunningham-react";
import {Controller, useFormContext} from "react-hook-form";

export const TextArea = (props: CTextAreaProps & { name: string }) => {
  const { control, setValue } = useFormContext();
  return (
    <Controller
      control={control}
      name={props.name}
      render={({ field, fieldState }) => {
        return (
          <CTextArea
            {...props}
            aria-invalid={!!fieldState.error}
            state={fieldState.error ? "error" : "default"}
            text={fieldState.error?.message}
            onBlur={field.onBlur}
            onChange={(e) => setValue(field.name, e.target.value)}
            value={field.value}
            fullWidth={true}
          />
        );
      }}
    />
  );
};
