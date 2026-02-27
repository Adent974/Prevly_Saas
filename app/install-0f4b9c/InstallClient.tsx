"use client"
import React from 'react'

export default function InstallClient({apkPath}:{apkPath:string}) {
  const [origin, setOrigin] = React.useState<string | null>(null)

  React.useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const apkUrl = origin ? `${origin}${apkPath}` : apkPath
  const qrSrc = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(apkUrl)}&chs=300x300`

  return (
    <div>
      <div style={{background: '#fff', padding: 16, display: 'inline-block', borderRadius: 8}}>
        <img src={qrSrc} alt="APK QR code" width={220} height={220} />
      </div>

      <div style={{marginTop: 18}}>
        <a href={apkUrl} download style={{display: 'inline-block', padding: '10px 14px', background: '#111827', color: '#fff', borderRadius: 6, textDecoration: 'none'}}>Download APK</a>
        <p style={{marginTop:8, color:'#555'}}>APK path: <span style={{fontFamily:'monospace'}}>{apkPath}</span></p>
      </div>
    </div>
  )
}
