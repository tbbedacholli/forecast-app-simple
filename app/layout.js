// app/layout.js
import './globals.css';
import { SidebarProvider } from '../contexts/SidebarContext';
import { CustomThemeProvider } from '../contexts/ThemeContext';

export const metadata = {
  title: 'Strum - ForecastPro',
  description: 'Forecasting, reimagined with AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CustomThemeProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </CustomThemeProvider>
      </body>
    </html>
  );
}