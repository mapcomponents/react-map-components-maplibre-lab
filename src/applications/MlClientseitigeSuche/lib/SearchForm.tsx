import React, { useContext, useCallback } from 'react';

import SearchContext from './SearchContext';
import { TextField, Autocomplete } from '@mui/material';

function debounce(func: (e: React.ChangeEvent<HTMLInputElement>) => void, wait: number) {
	let timeout: NodeJS.Timeout;

	return function executedFunction(e: React.ChangeEvent<HTMLInputElement>) {
		const later = () => {
			clearTimeout(timeout);
			func(e);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

export default function SearchForm() {
	const searchContext = useContext(SearchContext);

	const debouncedHandleInput = useCallback(
		debounce((e: React.ChangeEvent<HTMLInputElement>) => {
			searchContext.setSearchTerm(e.target.value);
		}, 200),
		[searchContext]
	);

	return (
		<>
			<Autocomplete
				options={searchContext?.searchResults || []}
				noOptionsText="Keine Optionen verfügbar."
				onSelect={debouncedHandleInput}
				value={searchContext?.selectedResult || ''}
				isOptionEqualToValue={(option, value) => option === value}
				onChange={(_, newValue) => {
					searchContext?.setSelectedResult(newValue ?? '');
				}}
				sx={{ width: 300 }}
				renderInput={(params: any) => {
					return <TextField {...params} />;
				}}
			/>
		</>
	);
}
