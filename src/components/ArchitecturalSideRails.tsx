import React from 'react';

export const ArchitecturalSideRails: React.FC = () => {
  return (
    <aside
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 hidden min-[1500px]:block overflow-hidden select-none"
    >
      {/* LEFT ARCHITECTURAL BLUEPRINT WING */}
      <div className="absolute inset-y-0 left-0 right-[calc(50%+720px)] bg-[#D8E2EE] overflow-hidden">
        <div className="absolute inset-0 bg-lab-grid opacity-95" />

        {/* Subtle Top & Bottom Ambient Technical Wash */}
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#CBD8E8]/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#CBD8E8]/75 to-transparent" />

        {/* Full-Height Vector PCB & Microcontroller Schematic Artwork */}
        <svg
          viewBox="0 0 260 1080"
          preserveAspectRatio="xMaxYMid slice"
          className="absolute inset-0 w-full h-full opacity-95"
          fill="none"
        >
          {/* Upper PCB Trace Routing */}
          <g stroke="#0866F5" strokeWidth="1.25" strokeOpacity="0.28">
            <path d="M 28 118 H 96 L 122 144 H 242" />
            <path d="M 16 136 H 84 L 110 162 H 246" />
            <path d="M 44 154 H 76 L 102 180 H 218" />
            <circle cx="28" cy="118" r="3.5" fill="#D8E2EE" />
            <circle cx="16" cy="136" r="3.5" fill="#D8E2EE" />
            <circle cx="44" cy="154" r="3.5" fill="#D8E2EE" />
            <circle cx="218" cy="180" r="3" fill="#0866F5" fillOpacity="0.35" />
          </g>

          {/* Upper MCU QFP-48 Package Footprint */}
          <g transform="translate(86 210)" stroke="#071A3B" strokeOpacity="0.24" strokeWidth="1.2">
            <rect x="0" y="0" width="68" height="68" rx="6" />
            <rect x="11" y="11" width="46" height="46" rx="3" strokeDasharray="3 3" />
            <circle cx="18" cy="18" r="2.6" fill="#EA580C" fillOpacity="0.5" stroke="none" />
            <path d="M 15 -10 V 0 M 28 -10 V 0 M 41 -10 V 0 M 54 -10 V 0" />
            <path d="M 15 68 V 78 M 28 68 V 78 M 41 68 V 78 M 54 68 V 78" />
            <path d="M -10 15 H 0 M -10 28 H 0 M -10 41 H 0 M -10 54 H 0" />
            <path d="M 68 15 H 78 M 68 28 H 78 M 68 41 H 78 M 68 54 H 78" />
          </g>

          {/* Mid-Wing Vertical Data Bus & Pin Header Schematic */}
          <g stroke="#071A3B" strokeOpacity="0.2" strokeWidth="1.2">
            <path d="M 120 318 V 438 L 94 464 V 592 L 120 618 V 710" stroke="#0866F5" strokeOpacity="0.25" />
            <path d="M 134 334 V 444 L 108 470 V 586 L 134 612 V 698" stroke="#0F766E" strokeOpacity="0.25" />
            <circle cx="120" cy="318" r="3.5" fill="#D8E2EE" />
            <circle cx="134" cy="334" r="3.5" fill="#D8E2EE" />
          </g>

          {/* Mid-Wing Pinout Block */}
          <g transform="translate(48 486)" stroke="#071A3B" strokeOpacity="0.22" strokeWidth="1.2">
            <rect x="0" y="0" width="28" height="84" rx="4" />
            <circle cx="9" cy="14" r="3" />
            <circle cx="19" cy="14" r="3" />
            <circle cx="9" cy="32" r="3" />
            <circle cx="19" cy="32" r="3" />
            <circle cx="9" cy="50" r="3" />
            <circle cx="19" cy="50" r="3" />
            <circle cx="9" cy="68" r="3" />
            <circle cx="19" cy="68" r="3" />
          </g>

          {/* Lower Differential Pair Bus & Fiducial Rings */}
          <g stroke="#0F766E" strokeWidth="1.25" strokeOpacity="0.28">
            <path d="M 248 742 H 168 L 140 770 V 888 L 112 916 H 26" />
            <path d="M 248 756 H 174 L 152 778 V 894 L 122 924 H 42" />
            <circle cx="26" cy="916" r="4.5" fill="#D8E2EE" />
            <circle cx="42" cy="924" r="4.5" fill="#D8E2EE" />
          </g>

          <g transform="translate(64 786)" stroke="#071A3B" strokeOpacity="0.22" strokeWidth="1.2">
            <circle cx="30" cy="30" r="24" strokeDasharray="4 4" />
            <circle cx="30" cy="30" r="11" />
            <path d="M 30 -2 V 14 M 30 46 V 62 M -2 30 H 14 M 46 30 H 62" />
          </g>

          <circle cx="192" cy="832" r="5" stroke="#EA580C" strokeOpacity="0.45" strokeWidth="1.4" />
          <circle cx="192" cy="832" r="2" fill="#EA580C" fillOpacity="0.5" />
        </svg>

        {/* Precision Edge Caliper Ruler Hugging the 1440px Center Stage */}
        <div
          className="absolute inset-y-0 right-0 w-3.5 border-l border-slate-400/35"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(7, 26, 59, 0.28) 0px, rgba(7, 26, 59, 0.28) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(to bottom, rgba(8, 102, 245, 0.48) 0px, rgba(8, 102, 245, 0.48) 1.5px, transparent 1.5px, transparent 50px)',
            backgroundSize: '6px 10px, 12px 50px',
            backgroundPosition: 'right top, right top',
            backgroundRepeat: 'repeat-y',
          }}
        />
      </div>

      {/* RIGHT ARCHITECTURAL BLUEPRINT WING */}
      <div className="absolute inset-y-0 left-[calc(50%+720px)] right-0 bg-[#D8E2EE] overflow-hidden">
        <div className="absolute inset-0 bg-lab-grid opacity-95" />

        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#CBD8E8]/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#CBD8E8]/75 to-transparent" />

        {/* Full-Height Vector LiDAR Polar Reticle & Robotic Kinematics Artwork */}
        <svg
          viewBox="0 0 260 1080"
          preserveAspectRatio="xMinYMid slice"
          className="absolute inset-0 w-full h-full opacity-95"
          fill="none"
        >
          {/* Upper 360 LiDAR Polar Reticle */}
          <g transform="translate(64 138)" stroke="#071A3B" strokeOpacity="0.24" strokeWidth="1.2">
            <circle cx="64" cy="64" r="54" strokeDasharray="5 4" />
            <circle cx="64" cy="64" r="36" stroke="#0866F5" strokeOpacity="0.35" />
            <circle cx="64" cy="64" r="16" stroke="#0F766E" strokeOpacity="0.38" />
            <path d="M 64 2 V 126 M 2 64 H 126" />
            <path d="M 21 21 L 107 107 M 107 21 L 21 107" strokeOpacity="0.16" />
            <circle cx="90" cy="38" r="3.5" fill="#EA580C" fillOpacity="0.55" stroke="none" />
          </g>

          {/* Upper Signal Bus Routing */}
          <g stroke="#0866F5" strokeWidth="1.25" strokeOpacity="0.26">
            <path d="M 12 288 H 92 L 118 314 H 232" />
            <path d="M 12 304 H 84 L 110 330 H 214" />
            <circle cx="232" cy="314" r="3.5" fill="#D8E2EE" />
            <circle cx="214" cy="330" r="3.5" fill="#D8E2EE" />
          </g>

          {/* Mid-Wing Stepper & Sensor Bus Diagram */}
          <g transform="translate(52 444)" stroke="#071A3B" strokeOpacity="0.22" strokeWidth="1.2">
            <rect x="18" y="0" width="96" height="58" rx="6" />
            <circle cx="66" cy="29" r="15" stroke="#0866F5" strokeOpacity="0.35" />
            <circle cx="66" cy="29" r="5" fill="#0F766E" fillOpacity="0.38" stroke="none" />
            <path d="M 0 18 H 18 M 0 40 H 18 M 114 18 H 138 M 114 40 H 138" />
          </g>

          <g stroke="#0F766E" strokeWidth="1.2" strokeOpacity="0.25">
            <path d="M 140 538 V 638 L 114 664 H 22" />
            <path d="M 154 538 V 646 L 124 676 H 38" />
            <circle cx="22" cy="664" r="3.5" fill="#D8E2EE" />
            <circle cx="38" cy="676" r="3.5" fill="#D8E2EE" />
          </g>

          {/* Lower Robotic Arm Linkage Schematic */}
          <g transform="translate(36 742)" stroke="#071A3B" strokeOpacity="0.24" strokeWidth="1.3">
            <path d="M 24 128 H 124" strokeWidth="2" />
            <path d="M 64 128 L 106 78 L 164 58 L 190 80" stroke="#0866F5" strokeOpacity="0.36" strokeWidth="1.6" />
            <circle cx="64" cy="128" r="7" fill="#D8E2EE" />
            <circle cx="106" cy="78" r="6.5" fill="#D8E2EE" stroke="#0F766E" strokeOpacity="0.5" />
            <circle cx="164" cy="58" r="5.5" fill="#D8E2EE" stroke="#EA580C" strokeOpacity="0.55" />
          </g>

          {/* PWM Telemetry Waveform Strip */}
          <path
            d="M 22 924 H 46 V 898 H 74 V 924 H 98 V 898 H 144 V 924 H 168 V 898 H 196 V 924 H 236"
            stroke="#0F766E"
            strokeOpacity="0.3"
            strokeWidth="1.35"
          />
        </svg>

        {/* Precision Edge Caliper Ruler Hugging the 1440px Center Stage */}
        <div
          className="absolute inset-y-0 left-0 w-3.5 border-r border-slate-400/35"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(7, 26, 59, 0.28) 0px, rgba(7, 26, 59, 0.28) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(to bottom, rgba(8, 102, 245, 0.48) 0px, rgba(8, 102, 245, 0.48) 1.5px, transparent 1.5px, transparent 50px)',
            backgroundSize: '6px 10px, 12px 50px',
            backgroundPosition: 'left top, left top',
            backgroundRepeat: 'repeat-y',
          }}
        />
      </div>
    </aside>
  );
};
