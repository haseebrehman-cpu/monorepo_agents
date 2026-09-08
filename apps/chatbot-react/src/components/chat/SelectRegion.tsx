const SelectRegion = ({ region, setRegion }: { region: string, setRegion: (region: string) => void }) => {
    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRegion(e.target.value);
    }
    return (
        <div>
            <select name="select-country" id="select-country" className="mt-5 max-w-xl text-base leading-relaxed text-neutral-300 border border-rdx-red/40 rounded-md p-2" value={region} onChange={handleRegionChange}>
                <option value="uk">UK</option>
                <option value="usa">US</option>
                <option value="eu">EU</option>
                <option value="ca">CA</option>
                <option value="uae">UAE</option>
                <option value="intl">International</option>
            </select>
        </div>
    )
}

export default SelectRegion