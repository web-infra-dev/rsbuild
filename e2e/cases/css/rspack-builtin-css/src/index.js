import './index.css';
import './index.less';
import './index.scss';
import lessStyles from './styles.module.less';
import sassStyles from './styles.module.scss';

globalThis.testStyles = {
  less: lessStyles.moduleLess,
  sass: sassStyles.moduleSass,
};
