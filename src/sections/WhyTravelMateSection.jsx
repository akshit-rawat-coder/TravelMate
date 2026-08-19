import { motion } from 'framer-motion'
import whyTravelMate from '../data/whyTravelMate'

function WhyTravelMateSection() {
  return (
    <section
      id="why-travelmate"
      className="border-y border-[var(--color-border)] bg-[var(--color-white)] py-16 sm:py-[4.5rem] lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-olive)]">
            Why TravelMate
          </p>
          <h2 className="mt-3 max-w-xl font-display text-[2.15rem] leading-[1.08] text-[var(--color-navy)] sm:text-[3rem]">
            A calm command center for every trip.
          </h2>
          <p className="mt-4 max-w-xl text-[1.02rem] leading-7 text-[color:rgba(32,37,34,0.82)]">
            TravelMate blends practical planning with premium editorial clarity so your decisions feel simple, informed,
            and exciting.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {whyTravelMate.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.05 }}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] p-6"
              >
                <Icon className="h-5 w-5 text-[var(--color-terracotta)]" />
                <h3 className="mt-3 text-[1.03rem] font-semibold text-[var(--color-navy)]">{item.title}</h3>
                <p className="mt-2 text-[0.92rem] leading-6 text-[color:rgba(32,37,34,0.8)]">{item.description}</p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default WhyTravelMateSection
