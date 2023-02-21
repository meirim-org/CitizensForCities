import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Map } from '../../components/Map/map';
import { Layer, Popup, Source, useMap } from 'react-map-gl';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom';
import { Button } from '../../shared';
import './styles.css';

const polygonStyle = {
	id: 'geojson',
	type: 'fill',
	paint: {
		'fill-color': '#e56666',
		'fill-outline-color': '#000000',
		'fill-opacity': 0.5
	},
};



const symbolStyle = ({ image, size }) => ({
	type:'symbol',
	sourceIde: 'geojson',
	paint: {
		'icon-opacity': [
			'case',
			['==', ['get', 'is_active'], true],
			1,
			0.7
		]
	},
	layout:{
		'icon-image': image,
		'icon-size': size,
		'icon-allow-overlap': true,
		'icon-ignore-placement': true,
		'text-field': '{total_trees} עצים',
		'text-size': 14,
		'icon-anchor': 'bottom',
		'text-anchor': 'top'
	},
});

const TreeMap = ({ geojson }) => {
	const [locationInfo, setLocationInfo] = useState(null);

	const onClick = useCallback(event => {
		const location = event.features && event.features[0];
		if (!location) {return;}

		setLocationInfo({
			longitude: event.lngLat.lng,
			latitude: event.lngLat.lat,
			properties: location && location.properties
		});
	}, []);

	const selectedLocationProps = (locationInfo && locationInfo.properties) || '';

	const timeToObjection = selectedLocationProps.is_active ? 'בתוקף': 'לא בתוקף';
	const place = selectedLocationProps.place;


	return (
		<>
			<Map interactiveLayerIds={['high-tree', 'low-tree', 'mid-tree']}
				onClick={onClick}
				mapStyle="mapbox://styles/meirim/cle36p24n003a01mtwtj1czve"
				style={{ width: '100vw', height: '100vh' }}
				initialViewState={{
					longitude:  34.82341235969558,
					latitude: 31.812881942711954,
					zoom: 7
				}}>
				<MapImage/>
				{ geojson &&  <Source id="trees-data" type="geojson" data={geojson}>
					<Layer {...polygonStyle} />
					<Layer  id='high-tree' {...symbolStyle({ image: 'large-tree-pin', size: 0.35 })}  filter={['>', ['get', 'total_trees'], 50]}/>
					<Layer  id='low-tree' {...symbolStyle({ image: 'medium-tree-pin', size: 0.2 })}  minzoom={12} filter={['<', ['get', 'total_trees'], 10]}/>
					<Layer  id='mid-tree' {...symbolStyle({ image: 'medium-tree-pin', size: 0.2 })}  minzoom={10} filter={['all', ['>=', ['get', 'total_trees'], 10], ['<=', ['get', 'total_trees'], 49]]}/>
				</Source>}

				{locationInfo && (
					<Popup longitude={locationInfo.longitude} latitude={locationInfo.latitude} style={{ minWidth: 250 }}
						anchor="bottom"
						closeButton={false}
						onClose={() => setLocationInfo(false)}>
						<Card>
							<CardContent className="card-content">
								<div className="map-title">
									{place && <span className="btn btn-light disabled">{place}</span>}
									{timeToObjection && <span className="btn btn-light map-title-left">{timeToObjection}</span>}
								</div>
								<Typography
									gutterBottom
									variant="h5"
									component="h2"
									color="textPrimary"
								>
									{`מספר העצים: ${selectedLocationProps.total_trees}`}
								</Typography>
								<Address tree={selectedLocationProps} />
								<ContentField field={selectedLocationProps.action} fieldBold='פעולה:'/>
								<ContentField field={selectedLocationProps.reason_short} fieldBold='סיבה:' />

								<Link
									className="card-link"
									to={'/tree/' + selectedLocationProps.id}
									target={'_blank'}
								>
									<Button text=" צפה בפרטים"  type={'primary'} small/>
								</Link>
							</CardContent>
						</Card>
					</Popup>)}
			</Map>
		</>
	);
};



function MapImage() {
	const { current: map } = useMap();
	if (!map.hasImage('large-tree-pin')) {
		map.loadImage('/images/trees-large-icon.png', (error, image) => {
			if (error) throw error;
			if (!map.hasImage('large-tree-pin')) map.addImage('large-tree-pin', image);
		});
	}

	if (!map.hasImage('medium-tree-pin')) {
		map.loadImage('/images/trees-medium-icon.png', (error, image) => {
			if (error) throw error;
			if (!map.hasImage('medium-tree-pin')) map.addImage('medium-tree-pin', image);
		});
	}

	return null;
}

function Address(props) {
	// eslint-disable-next-line react/prop-types
	const { street, street_number } = props.tree;
	let address = 'לא מצוין';
	if (street && street_number) {
		address = `${street} ${street_number}`;
	}
	else if (street) {
		address = `${street}`;
	}

	return (
		<Typography component="p" color="textPrimary"> <strong>כתובת: </strong>{address}</Typography>
	);
};

function ContentField(props) {
	// eslint-disable-next-line react/prop-types
	const { field, fieldBold } = props;
	const text = field || 'לא מצוין';

	return 	<Typography component="p" color="textPrimary"> <strong>{fieldBold} </strong>{text}</Typography>;
}

TreeMap.propTypes = {
	isMobile: PropTypes.func.isRequired,
	geojson: PropTypes.object.isRequired,
};

export default TreeMap;