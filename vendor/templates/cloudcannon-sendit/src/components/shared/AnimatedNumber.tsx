import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  numberValue: number;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  numberValue,
  className = "",
  style = {},
  duration = 1500,
}) => {
  const [displayNumber, setDisplayNumber] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Parse the target number (handle string numbers and numbers with commas)
  const targetNumber = parseFloat(numberValue.toString().replace(/,/g, ""));
  const isInteger = Number.isInteger(targetNumber);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = 0;
    const endValue = targetNumber;

    const animate = (): void => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      const currentValue = startValue + (endValue - startValue) * easeOutQuart;

      // Format number appropriately
      if (isInteger) {
        setDisplayNumber(Math.floor(currentValue));
      } else {
        setDisplayNumber(parseFloat(currentValue.toFixed(2)));
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayNumber(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, targetNumber, duration, isInteger]);

  return (
    <span ref={elementRef} className={className} style={style}>
      {displayNumber}
    </span>
  );
};

export default AnimatedNumber;
