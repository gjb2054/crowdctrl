import { Button } from "@aws-amplify/ui-react";
import './NavBar.css';

export default function NavBar({ signOut, email }) {
    return (
      <div className="nav-bar">
        <div className="nav-item">{email}</div>
        <div className="header">CrowdControl</div>
        <Button className="nav-button" onClick={signOut}>Sign Out</Button>
      </div>
    );
  }

  