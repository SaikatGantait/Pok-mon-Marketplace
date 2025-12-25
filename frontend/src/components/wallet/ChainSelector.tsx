type Props = { mobile?: boolean }

export default function ChainSelector({ mobile = false }: Props) {
  return (
    <div className={mobile ? 'w-full' : ''}>
      <select
        className={`border border-gray-300 rounded-lg px-3 py-2 text-sm ${mobile ? 'w-full' : ''}`}
        defaultValue="Solana"
        aria-label="Select blockchain"
        disabled
      >
        <option>Solana</option>
      </select>
    </div>
  )
}
