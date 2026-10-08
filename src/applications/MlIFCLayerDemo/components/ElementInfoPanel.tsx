import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import { IfcElementInfo } from './MlIfcLayer';

interface ElementInfoPanelProps {
	element: IfcElementInfo | undefined;
	onClose: () => void;
}

const formatLabel = (key: string): string => key
	.replace(/([a-z])([A-Z])/g, '$1 $2')
	.replace(/[_-]+/g, ' ')
	.replace(/^./, (character) => character.toUpperCase());

const formatValue = (value: unknown): string => {
	if (value == null) return 'Not available';
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	if (Array.isArray(value)) {
		return value.map(formatValue).join(', ');
	}
	if (typeof value === 'object') {
		const record = value as Record<string, unknown>;
		if ('value' in record) {
			return formatValue(record.value);
		}

		const preferredKey = ['Name', 'name', 'Value', 'value', 'NominalValue', 'nominalValue']
			.find((key) => key in record);
		if (preferredKey) return formatValue(record[preferredKey]);

		const displayEntries = Object.entries(record)
			.filter(([key]) => key !== 'expressID' && key !== 'type' && key !== 'Type');
		if (displayEntries.length === 0) return 'Not available';

		return displayEntries
			.map(([key, entry]) => `${formatLabel(key)}: ${formatValue(entry)}`)
			.join('; ');
	}
	return String(value);
};

const ElementInfoPanel = ({ element, onClose }: ElementInfoPanelProps) => {
	if (!element) return null;

	const properties = Object.entries(element.properties ?? element.attributes);

	return (
		<Paper
			elevation={4}
			sx={{
				position: 'absolute',
				top: '80px',
				right: '20px',
				width: 'min(320px, calc(100vw - 40px))',
				boxSizing: 'border-box',
				maxHeight: 'calc(100vh - 120px)',
				overflowY: 'auto',
				zIndex: 1100,
				borderRadius: 2,
			}}
		>
			<Box
				sx={{
					p: 2,
					bgcolor: 'primary.main',
					color: 'primary.contrastText',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					borderTopLeftRadius: 8,
					borderTopRightRadius: 8,
				}}
			>
				<Typography variant="h6" component="span">
					Element Details
				</Typography>
				<IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
					<CloseIcon />
				</IconButton>
			</Box>

			<Box sx={{ p: 2 }}>
				<Box
					sx={{
						mb: 2,
						p: 1.5,
						bgcolor: '#f5f5f5',
						borderRadius: 1,
						borderLeft: '4px solid',
						borderColor: 'primary.main',
					}}
				>
					<Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
						{element.type}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Express ID: {element.expressId}
					</Typography>
				</Box>

				{element.detailsLoading && (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<CircularProgress size={16} />
						<Typography variant="body2" color="text.secondary">Loading IFC details</Typography>
					</Box>
				)}
				{element.detailsError && (
					<Typography variant="body2" color="error" sx={{ mb: 1 }}>
						Could not load all IFC details: {element.detailsError}
					</Typography>
				)}
				{properties.length > 0 ? properties.map(([key, value]) => (
					<Box
						key={key}
						sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.75, borderBottom: '1px solid #f0f0f0' }}
					>
						<Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, maxWidth: '42%', overflowWrap: 'anywhere' }}>
							{formatLabel(key)}
						</Typography>
						<Typography variant="body2" sx={{ minWidth: 0, maxWidth: '58%', textAlign: 'right', fontWeight: 500, overflowWrap: 'anywhere' }}>
							{formatValue(value)}
						</Typography>
					</Box>
				)) : (
					<Typography variant="body2" color="text.secondary">No configured properties available</Typography>
				)}
			</Box>
		</Paper>
	);
};

export default ElementInfoPanel;
