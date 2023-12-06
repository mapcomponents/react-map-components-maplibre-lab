export interface SearchContextInterface {
	searchTerm: string | undefined;
	setSearchTerm: (term: string | undefined) => void;
	searchResults: string[] | undefined;
	setSearchResults: (results: string[]) => void;
	selectedResult: string | undefined;
	setSelectedResult: (term: string | undefined) => void;
}
