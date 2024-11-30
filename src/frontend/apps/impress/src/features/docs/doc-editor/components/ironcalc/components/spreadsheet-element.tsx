import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import init, { Model } from "@ironcalc/wasm"
import Workbook from './workbook'
import { WorkbookState } from './workbookState'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../theme' // You'll need to extract the theme from your app

class SpreadsheetElement extends HTMLElement {
  private root: ReactDOM.Root | null = null
  private model: Model | null = null
  private workbookState: WorkbookState | null = null

  async connectedCallback() {
    // Initialize WASM
    await init()
    
    // Initialize model and state
    this.model = new Model("Untitled sheet", "en-US", "UTC")
    this.workbookState = new WorkbookState()
    
    // Create wrapper div for shadow DOM styling isolation
    const wrapper = document.createElement('div')
    wrapper.style.width = '100%'
    wrapper.style.height = '100%'
    this.appendChild(wrapper)
    
    this.root = ReactDOM.createRoot(wrapper)
    this.root.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <Workbook 
            model={this.model}
            workbookState={this.workbookState}
          />
        </ThemeProvider>
      </React.StrictMode>
    )
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount()
    }
  }
}

// Only define the custom element if it hasn't been defined yet
if (!customElements.get('iron-spreadsheet')) {
  customElements.define('iron-spreadsheet', SpreadsheetElement)
} 