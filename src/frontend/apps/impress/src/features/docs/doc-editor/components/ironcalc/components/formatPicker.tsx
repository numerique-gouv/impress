import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type FormatPickerProps = {
  className?: string;
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  numFmt: string;
  onChange: (numberFmt: string) => void;
};

const FormatPicker = (properties: FormatPickerProps) => {
  const { t } = useTranslation();
  const [formatCode, setFormatCode] = useState(properties.numFmt);

  const onSubmit = (format_code: string): void => {
    properties.onChange(format_code);
    properties.onClose();
  };
  return (
    <Dialog open={properties.open} onClose={properties.onClose}>
      <DialogTitle>{t("num_fmt.title")}</DialogTitle>
      <DialogContent dividers>
        <TextField
          defaultValue={properties.numFmt}
          label={t("num_fmt.label")}
          name="format_code"
          onChange={(event) => setFormatCode(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
          spellCheck="false"
          onClick={(event) => event.stopPropagation()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onSubmit(formatCode)}>
          {t("num_fmt.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormatPicker;
