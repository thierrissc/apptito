"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface GeometricCharactersProps {
  isPasswordFocused: boolean
  isPasswordVisible: boolean
}

export function GeometricCharacters({ isPasswordFocused, isPasswordVisible }: GeometricCharactersProps) {
  const [animationPhase, setAnimationPhase] = useState<"entering" | "idle">("entering")
  const pupilsRef = useRef<SVGCircleElement[]>([])
  const eyelidsRef = useRef<SVGRectElement[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationPhase("idle")
    }, 6500)
    return () => clearTimeout(timer)
  }, [])

  const coverEyes = useCallback(() => {
    eyelidsRef.current.forEach((lid) => {
      if (lid) lid.setAttribute("height", "25")
    })
    pupilsRef.current.forEach((p) => {
      if (p) p.style.transform = "translate(0,0)"
    })
  }, [])

  const uncoverEyes = useCallback(() => {
    eyelidsRef.current.forEach((lid) => {
      if (lid) lid.setAttribute("height", "0")
    })
  }, [])

  useEffect(() => {
    if (isPasswordFocused && !isPasswordVisible) {
      coverEyes()
    } else {
      uncoverEyes()
    }
  }, [isPasswordFocused, isPasswordVisible, coverEyes, uncoverEyes])

  useEffect(() => {
    const handleMove = (x: number, y: number) => {
      if (isPasswordFocused && !isPasswordVisible) return

      pupilsRef.current.forEach((pupil) => {
        if (!pupil) return
        const rect = pupil.getBoundingClientRect()
        const pupilCenterX = rect.left + rect.width / 2
        const pupilCenterY = rect.top + rect.height / 2

        const angle = Math.atan2(y - pupilCenterY, x - pupilCenterX)
        const distance = Math.min(3, Math.hypot(x - pupilCenterX, y - pupilCenterY) / 15)

        const moveX = Math.cos(angle) * distance
        const moveY = Math.sin(angle) * distance

        pupil.style.transform = `translate(${moveX}px, ${moveY}px)`
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("touchmove", handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
    }
  }, [isPasswordFocused, isPasswordVisible])

  const setPupilRef = (index: number) => (el: SVGCircleElement | null) => {
    if (el) pupilsRef.current[index] = el
  }

  const setEyelidRef = (index: number) => (el: SVGRectElement | null) => {
    if (el) eyelidsRef.current[index] = el
  }

  return (
    <svg
      className="w-full h-full max-h-[350px] md:max-h-[500px] drop-shadow-lg transform translate-y-4 md:translate-y-10 overflow-visible"
      viewBox="0 0 400 350"
      fill="none"
      preserveAspectRatio="xMidYMax meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        <style>
          {`
            /* Entry Animations - chegando COM pulo e quicada */
            @keyframes enterFromTopWithBounce {
              0% { 
                transform: translateY(-500px) rotate(-5deg); 
                opacity: 1;
              }
              15% { 
                transform: translateY(-250px) rotate(3deg); 
                opacity: 1;
              }
              28% { 
                transform: translateY(-80px) rotate(-2deg) scaleY(0.95);
                opacity: 1;
              }
              /* Primeira quicada ao chegar */
              35% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
                opacity: 1;
              }
              37% { 
                transform: translateY(5px) rotate(0deg) scaleY(0.85);
              }
              /* Segunda quicada */
              46% { 
                transform: translateY(-35px) rotate(6deg) scaleY(0.97);
              }
              55% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
              }
              57% { 
                transform: translateY(3px) rotate(0deg) scaleY(0.87);
              }
              /* Terceira quicada */
              64% { 
                transform: translateY(-15px) rotate(-4deg) scaleY(0.98);
              }
              72% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
              }
              74% { 
                transform: translateY(2px) rotate(0deg) scaleY(0.9);
              }
              /* Quarta quicada pequenininha */
              80% { 
                transform: translateY(-5px) rotate(2deg) scaleY(0.99);
              }
              88% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
              }
              100% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
              }
            }
            
            @keyframes enterFromRightWithBounce {
              0% { 
                transform: translateX(550px) rotate(-8deg); 
                opacity: 1;
              }
              15% { 
                transform: translateX(300px) translateY(-15px) rotate(5deg); 
                opacity: 1;
              }
              28% { 
                transform: translateX(60px) rotate(-2deg) scaleY(0.95);
                opacity: 1;
              }
              /* Primeira quicada */
              35% { 
                transform: translateX(0) rotate(0deg) scaleY(1);
                opacity: 1;
              }
              37% { 
                transform: translateY(4px) rotate(0deg) scaleY(0.85);
              }
              /* Segunda quicada */
              46% { 
                transform: translateX(-5px) translateY(-28px) rotate(-8deg) scaleY(0.97);
              }
              55% { 
                transform: translateX(0) rotate(0deg) scaleY(1);
              }
              57% { 
                transform: translateY(3px) rotate(0deg) scaleY(0.88);
              }
              /* Terceira quicada */
              64% { 
                transform: translateY(-12px) rotate(5deg) scaleY(0.98);
              }
              72% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
              }
              74% { 
                transform: translateY(2px) rotate(0deg) scaleY(0.91);
              }
              /* Quarta quicada */
              80% { 
                transform: translateY(-4px) rotate(-3deg);
              }
              88% { 
                transform: translateY(0) rotate(0deg);
              }
              100% { 
                transform: translateY(0) rotate(0deg);
              }
            }
            
            @keyframes enterFromLeftWithBounce {
              0% { 
                transform: translateX(-550px) rotate(8deg); 
                opacity: 1;
              }
              15% { 
                transform: translateX(-300px) translateY(-15px) rotate(-5deg); 
                opacity: 1;
              }
              28% { 
                transform: translateX(-60px) rotate(2deg) scaleY(0.95);
                opacity: 1;
              }
              /* Primeira quicada */
              35% { 
                transform: translateX(0) rotate(0deg) scaleY(1);
                opacity: 1;
              }
              37% { 
                transform: translateY(4px) rotate(0deg) scaleY(0.84);
              }
              /* Segunda quicada */
              46% { 
                transform: translateX(4px) translateY(-32px) rotate(7deg) scaleY(0.97);
              }
              55% { 
                transform: translateX(0) rotate(0deg) scaleY(1);
              }
              57% { 
                transform: translateY(3px) rotate(0deg) scaleY(0.86);
              }
              /* Terceira quicada */
              64% { 
                transform: translateY(-14px) rotate(-5deg) scaleY(0.98);
              }
              72% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
              }
              74% { 
                transform: translateY(2px) rotate(0deg) scaleY(0.89);
              }
              /* Quarta quicada */
              80% { 
                transform: translateY(-5px) rotate(3deg);
              }
              88% { 
                transform: translateY(0) rotate(0deg);
              }
              100% { 
                transform: translateY(0) rotate(0deg);
              }
            }
            
            @keyframes enterFromBottomWithBounce {
              0% { 
                transform: translateY(500px) rotate(6deg); 
                opacity: 1;
              }
              15% { 
                transform: translateY(300px) translateX(10px) rotate(-4deg); 
                opacity: 1;
              }
              28% { 
                transform: translateY(70px) translateX(-5px) rotate(3deg) scaleY(0.92);
                opacity: 1;
              }
              /* Primeira quicada grande */
              35% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
                opacity: 1;
              }
              37% { 
                transform: translateY(5px) rotate(0deg) scaleY(0.82);
              }
              /* Segunda quicada */
              46% { 
                transform: translateY(-38px) rotate(10deg) scaleY(0.95);
              }
              55% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
              }
              57% { 
                transform: translateY(4px) rotate(0deg) scaleY(0.85);
              }
              /* Terceira quicada */
              64% { 
                transform: translateY(-18px) rotate(-7deg) scaleY(0.97);
              }
              72% { 
                transform: translateY(0) rotate(0deg) scaleY(1);
              }
              74% { 
                transform: translateY(3px) rotate(0deg) scaleY(0.88);
              }
              /* Quarta quicada */
              80% { 
                transform: translateY(-6px) rotate(4deg);
              }
              88% { 
                transform: translateY(0) rotate(0deg);
              }
              100% { 
                transform: translateY(0) rotate(0deg);
              }
            }
            
            /* Idle Animations - continuous subtle movements */
            @keyframes idleWobble {
              0%, 100% { transform: rotate(0deg) translateY(0); }
              25% { transform: rotate(-1.5deg) translateY(-2px); }
              50% { transform: rotate(0deg) translateY(0); }
              75% { transform: rotate(1.5deg) translateY(-2px); }
            }
            
            @keyframes idleBounce {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              25% { transform: translateY(-3px) rotate(-1deg); }
              50% { transform: translateY(0) rotate(0deg); }
              75% { transform: translateY(-2px) rotate(1deg); }
            }
            
            @keyframes idleSway {
              0%, 100% { transform: translateX(0) rotate(0deg); }
              25% { transform: translateX(-2px) rotate(-1.5deg); }
              50% { transform: translateX(0) rotate(0deg); }
              75% { transform: translateX(2px) rotate(1.5deg); }
            }
            
            @keyframes idleJiggle {
              0%, 100% { transform: rotate(0deg) scale(1); }
              20% { transform: rotate(-1deg) scale(1.01); }
              40% { transform: rotate(1deg) scale(0.99); }
              60% { transform: rotate(-0.8deg) scale(1.005); }
              80% { transform: rotate(0.8deg) scale(0.995); }
            }
            
            /* Entry state classes */
            .char-purple-enter {
              animation: enterFromTopWithBounce 5.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
              transform: translateY(-500px);
            }
            
            .char-black-enter {
              animation: enterFromRightWithBounce 5.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards;
              transform: translateX(550px);
            }
            
            .char-yellow-enter {
              animation: enterFromLeftWithBounce 5.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.6s forwards;
              transform: translateX(-550px);
            }
            
            .char-orange-enter {
              animation: enterFromBottomWithBounce 5.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.45s forwards;
              transform: translateY(500px);
            }
            
            /* Idle state classes - após entrada, volta ao repouso */
            .char-purple-idle {
              animation: idleWobble 4s ease-in-out infinite;
            }
            
            .char-black-idle {
              animation: idleBounce 3.8s ease-in-out infinite;
            }
            
            .char-yellow-idle {
              animation: idleSway 4.2s ease-in-out infinite;
            }
            
            .char-orange-idle {
              animation: idleJiggle 3.5s ease-in-out infinite;
            }
          `}
        </style>
      </defs>

      <g 
        id="char-purple" 
        className={animationPhase === "entering" ? "char-purple-enter" : "char-purple-idle"}
        style={{ 
          transformOrigin: "135px 195px",
          transform: animationPhase === "entering" ? "translateY(-500px)" : undefined
        }}
      >
        <rect x="70" y="40" width="130" height="310" fill="#7C3AED" className="dark:fill-violet-800 transition-colors" />
        <circle cx="115" cy="100" r="10" fill="white" />
        <circle cx="165" cy="100" r="10" fill="white" />
        <circle
          ref={setPupilRef(0)}
          cx="115"
          cy="100"
          r="4"
          fill="black"
          className="transition-transform duration-[50ms] ease-linear"
        />
        <circle
          ref={setPupilRef(1)}
          cx="165"
          cy="100"
          r="4"
          fill="black"
          className="transition-transform duration-[50ms] ease-linear"
        />
        <rect ref={setEyelidRef(0)} x="105" y="85" width="20" height="0" fill="#7C3AED" className="dark:fill-violet-800 transition-all duration-300" />
        <rect ref={setEyelidRef(1)} x="155" y="85" width="20" height="0" fill="#7C3AED" className="dark:fill-violet-800 transition-all duration-300" />
        <path d="M125 140 Q140 155 155 140" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      <g 
        id="char-black" 
        className={animationPhase === "entering" ? "char-black-enter" : "char-black-idle"}
        style={{ 
          transformOrigin: "220px 235px",
          transform: animationPhase === "entering" ? "translateX(550px)" : undefined
        }}
      >
        <rect x="180" y="120" width="80" height="230" fill="#111827" className="dark:fill-black transition-colors" />
        <circle cx="205" cy="150" r="12" fill="white" />
        <circle cx="235" cy="150" r="12" fill="white" />
        <circle
          ref={setPupilRef(2)}
          cx="205"
          cy="150"
          r="5"
          fill="black"
          className="transition-transform duration-[50ms] ease-linear"
        />
        <circle
          ref={setPupilRef(3)}
          cx="235"
          cy="150"
          r="5"
          fill="black"
          className="transition-transform duration-[50ms] ease-linear"
        />
        <rect ref={setEyelidRef(2)} x="190" y="130" width="30" height="0" fill="#111827" className="dark:fill-black transition-all duration-300" />
        <rect ref={setEyelidRef(3)} x="220" y="130" width="30" height="0" fill="#111827" className="dark:fill-black transition-all duration-300" />
        <path d="M210 185 Q220 195 230 185" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      <g 
        id="char-yellow" 
        className={animationPhase === "entering" ? "char-yellow-enter" : "char-yellow-idle"}
        style={{ 
          transformOrigin: "280px 275px",
          transform: animationPhase === "entering" ? "translateX(-550px)" : undefined
        }}
      >
        <path
          d="M 240 200 A 40 40 0 0 1 320 200 V 350 H 240 V 200 Z"
          fill="#EAB308"
          className="dark:fill-yellow-600 transition-colors"
        />

        <circle cx="265" cy="220" r="8" fill="white" />
        <circle cx="295" cy="220" r="8" fill="white" />
        <circle
          ref={setPupilRef(4)}
          cx="265"
          cy="220"
          r="3"
          fill="#1F2937"
          className="transition-transform duration-[50ms] ease-linear"
        />
        <circle
          ref={setPupilRef(5)}
          cx="295"
          cy="220"
          r="3"
          fill="#1F2937"
          className="transition-transform duration-[50ms] ease-linear"
        />
        <rect ref={setEyelidRef(4)} x="257" y="210" width="16" height="0" fill="#EAB308" className="dark:fill-yellow-600 transition-all duration-300" />
        <rect ref={setEyelidRef(5)} x="287" y="210" width="16" height="0" fill="#EAB308" className="dark:fill-yellow-600 transition-all duration-300" />
        <path d="M270 250 Q280 258 290 250" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      <g 
        id="char-orange" 
        className={animationPhase === "entering" ? "char-orange-enter" : "char-orange-idle"}
        style={{ 
          transformOrigin: "110px 305px",
          transform: animationPhase === "entering" ? "translateY(500px)" : undefined
        }}
      >
        <path
          d="M 10 335 A 100 100 0 0 1 210 335 Z"
          fill="#F97316"
          className="dark:fill-orange-700 transition-colors"
        />

        <circle cx="80" cy="280" r="10" fill="white" />
        <circle cx="130" cy="280" r="10" fill="white" />
        <circle
          ref={setPupilRef(6)}
          cx="80"
          cy="280"
          r="4"
          fill="#1F2937"
          className="transition-transform duration-[50ms] ease-linear"
        />
        <circle
          ref={setPupilRef(7)}
          cx="130"
          cy="280"
          r="4"
          fill="#1F2937"
          className="transition-transform duration-[50ms] ease-linear"
        />
        <rect ref={setEyelidRef(6)} x="70" y="268" width="20" height="0" fill="#F97316" className="dark:fill-orange-700 transition-all duration-300" />
        <rect ref={setEyelidRef(7)} x="120" y="268" width="20" height="0" fill="#F97316" className="dark:fill-orange-700 transition-all duration-300" />

        <path d="M 85 305 Q 105 325 125 305" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 70 265 Q 80 260 90 265" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M 120 265 Q 130 260 140 265" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  )
}
