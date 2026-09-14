import { motion, AnimatePresence } from 'framer-motion';

export function AgentCard({
  number, name, desc, isActive, isComplete, children
}: {
  number: string; name: string; desc: string; isActive: boolean; isComplete: boolean; children: React.ReactNode
}) {
  let statusColor = 'bg-muted border-border';
  if (isActive) statusColor = 'bg-card border-primary ring-1 ring-primary shadow-[0_0_20px_rgba(124,58,237,0.15)]';
  if (isComplete) statusColor = 'bg-card border-emerald-500/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl transition-[border-color,box-shadow,background-color] duration-300 overflow-hidden ${statusColor} backdrop-blur-sm relative`}
    >
      <div className="p-5 md:p-6 flex flex-col">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isActive ? 'bg-primary text-primary-foreground' : isComplete ? 'bg-emerald-500/20 text-emerald-500' : 'bg-secondary text-muted-foreground'}`}>
            {number}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              {name}
              {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              {isComplete && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{desc}</p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {(isActive || isComplete) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
