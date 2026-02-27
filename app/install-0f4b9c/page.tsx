import InstallClient from './InstallClient'

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function InstallPage() {
  const apkPath = (process.env.NEXT_PUBLIC_APK_PATH as string) || "/app.apk"

  return (
    <main style={{fontFamily: 'Inter, system-ui, -apple-system, Roboto, sans-serif', padding: 24}}>
      <h1 style={{fontSize: 22, marginBottom: 12}}>Hidden APK install</h1>
      <p style={{marginBottom: 18}}>Scan the QR code to download the APK, or tap the button below on Android to install.</p>

      <InstallClient apkPath={apkPath} />

      <p style={{marginTop: 30, color: '#777'}}>Notes: Place your APK at <strong>/public/app.apk</strong> or set <strong>NEXT_PUBLIC_APK_PATH</strong> to the file path (e.g. /app.apk).</p>
    </main>
  )
}
