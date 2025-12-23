type Props = { mobile?: boolean }

export default function ChainSelector({ mobile = false }: Props) {
  return (
    <div className={mobile ? 'w-full' : ''}>
      <select
        className={`border border-gray-300 rounded-lg px-3 py-2 text-sm ${mobile ? 'w-full' : ''}`}
        defaultValue="All"
        aria-label="Select blockchain"
      >
        <option>All</option>
        <option>Solana</option>
        <option>Aptos</option>
        <option>Algorand</option>
      </select>
    </div>
  )
}
