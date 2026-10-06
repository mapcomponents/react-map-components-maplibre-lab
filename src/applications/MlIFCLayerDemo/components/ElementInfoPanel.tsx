import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { IfcElementInfo } from './MlIfcLayer';

interface ElementInfoPanelProps {
	element: IfcElementInfo | undefined;
	onClose: () => void;
}

const ElementInfoPanel = ({ element, onClose }: ElementInfoPanelProps) => {
	if (!element) return null;

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

				{Object.keys(element.attributes).length > 0 && (
					<>
						<Typography
							variant="subtitle2"
							sx={{ fontWeight: 'bold', mb: 1, borderBottom: '1px solid #e0e0e0', pb: 0.5 }}
						>
							Attributes
						</Typography>
						{Object.entries(element.attributes).map(([key, value]) => (
							<Box
								key={key}
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									py: 0.5,
									borderBottom: '1px solid #f0f0f0',
									'&:hover': {
										bgcolor: '#f9f9f9',
									},
								}}
							>
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ minWidth: 0, maxWidth: '38%', overflowWrap: 'anywhere' }}
								>
									{key}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 500,
										minWidth: 0,
										maxWidth: '62%',
										textAlign: 'right',
										whiteSpace: 'normal',
										overflowWrap: 'anywhere',
										wordBreak: 'break-word',
									}}
								>
									{String(value)}
								</Typography>
							</Box>
						))}
					</>
				)}

				{Object.keys(element.attributes).length === 0 && (
					<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
						No additional attributes available
					</Typography>
				)}
			</Box>
		</Paper>
	);
};

export default ElementInfoPanel;
