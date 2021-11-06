import leaflet from 'leaflet';
import { useTranslation } from 'locale/he_IL';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Circle, Map, TileLayer } from 'react-leaflet';
import api from 'services/api';
import '../../../node_modules/leaflet/dist/leaflet.css';
import AlertTable from '../AlertTable';
import { Message } from './style';

const AlertList = ({ notifyDeletedAlert, alerts }) => {
	const [bounds, setBounds] = useState([{ lat: 35, lng: 35 }, { lat: 25, lng: 25 }]);
	const { t } = useTranslation();
	React.useEffect(() => {
		let transparentLayer = leaflet.geoJSON();
		if (alerts.length > 0) {
			alerts.map(alert =>
				leaflet.geoJSON(alert.geom).addTo(transparentLayer)
			);
			const layerBounds = transparentLayer.getBounds();
			setBounds([
				layerBounds._southWest,
				layerBounds._northEast
			]);
		}
	}, [alerts]);

	const handleDelete = (alertId) => {
		api.delete('/alert/' + alertId).then(() => {
			notifyDeletedAlert();
		});
	};

	const noAlertsMsg = <Message>הוסיפו התראות כדי להשאר מעודכנים!</Message>;

	const alertGrid = <div>
		<AlertTable alerts={alerts} onDelete={handleDelete} />
		<Mapa alerts={alerts} bounds={bounds} />
	</div>;

	return (<div id="alert-map-container">
		<h5 className="container-title">{t.alerts}</h5>
		{alerts.length > 0 ? alertGrid : noAlertsMsg}
	</div>);
}

AlertList.propTypes = {
	notifyDeletedAlert: PropTypes.func.isRequired,
	alerts: PropTypes.array.isRequired
};

export default AlertList;

function Mapa(props) {
	return (
		<Map
			bounds={props.bounds}
			style={{
				height: '300px',
				width: '100%'
			}}
		>
			<TileLayer
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
			/>
			{props.alerts.map((alert, idx) => {
				if (alert.geom) {
					let center = leaflet
						.geoJSON(alert.geom)
						.getBounds()
						.getCenter();

					const radius = alert.radius ? alert.radius * 1000 : 1000;

					return (
						<Circle
							radius={radius}
							center={center}
							key={idx}
						/>
					);
				} else {
					// return no element
					return (
						<>
						</>
					);
				}
			})}
		</Map>
	);
}

Mapa.propTypes = {
	alerts: PropTypes.array,
	bounds: PropTypes.array
}
