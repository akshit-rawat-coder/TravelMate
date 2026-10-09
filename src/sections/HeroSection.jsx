import { motion } from 'framer-motion'
import TripPlanningForm from '../components/TripPlanningForm'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80'

function HeroSection() {
  return (
    <section className="relative border-b border-[var(--color-border)]">
      <div className="absolute inset-0">
        <img src={HERO_IMAGE} alt="Mountain valley destination view" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[color:rgba(20,36,57,0.42)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-12 lg:pb-20 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:rgba(255,253,248,0.88)] sm:text-sm">
            Premium Travel Planning
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-[2.7rem] leading-[1.02] text-[#FFFDF8] sm:text-[3.8rem] lg:text-[4.6rem]">
            YOUR NEXT JOURNEY STARTS HERE.
          </h1>
          <p className="mt-5 text-base text-[color:rgba(255,253,248,0.92)] sm:text-lg">
            Plan smarter. Travel better.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
          className="max-w-6xl"
        >
          <TripPlanningForm />
        </motion.div>
      </div>
    </section>
  )
}

export default HeroSection
