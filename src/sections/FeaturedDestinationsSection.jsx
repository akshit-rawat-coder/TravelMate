import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import destinations from '../data/destinations'

function FeaturedDestinationsSection() {
  return (
    <section id="featured" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-olive)]">
          Featured Destinations
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[2.15rem] leading-[1.08] text-[var(--color-navy)] sm:text-[3rem]">
          Places worth planning around.
        </h2>
      </motion.div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {destinations.map((destination, index) => (
          <motion.article
            key={destination.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.06 }}
            className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-white)]"
          >
            <img src={destination.image} alt={`${destination.name}, ${destination.country}`} className="h-64 w-full object-cover" />
            <div className="space-y-2 p-5">
              <h3 className="font-display text-[2rem] leading-none text-[var(--color-navy)]">{destination.name}</h3>
              <p className="inline-flex items-center gap-1.5 text-[0.9rem] text-[color:rgba(32,37,34,0.8)]">
                <MapPin className="h-4 w-4 text-[var(--color-terracotta)]" />
                {destination.country}
              </p>
              <p className="text-[0.9rem] font-medium text-[var(--color-olive)]">Best time: {destination.bestTime}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

export default FeaturedDestinationsSection
