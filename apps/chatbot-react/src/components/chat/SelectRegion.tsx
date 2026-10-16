const optionClassName = "bg-white text-neutral-950";

const SelectRegion = ({ region, setRegion }: { region: string, setRegion: (region: string) => void }) => {
    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRegion(e.target.value);
    }
    return (
        <div>
            <select name="select-country" id="select-country" className="mt-5 max-w-xl rounded-md border border-rdx-red/40 bg-neutral-950 p-2 text-base leading-relaxed text-white" value={region} onChange={handleRegionChange}>
                <option className={optionClassName} value="uk">UK</option>
                <option className={optionClassName} value="usa">US</option>
                <option className={optionClassName} value="eu">EU</option>
                <option className={optionClassName} value="ca">CA</option>
                <option className={optionClassName} value="uae">UAE</option>
                <option className={optionClassName} value="intl">International</option>
            </select>
        </div>
    )
}

export default SelectRegion